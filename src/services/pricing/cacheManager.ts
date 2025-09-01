import { differenceInSeconds, differenceInMinutes } from 'date-fns'
import type { PriceQuote } from '../../models/types'

interface CacheEntry<T> {
	data: T
	timestamp: number
	ttl: number
}

interface CacheStats {
	hits: number
	misses: number
	evictions: number
}

export class CacheManager {
	private memoryCache = new Map<string, CacheEntry<any>>()
	private stats: CacheStats = { hits: 0, misses: 0, evictions: 0 }
	private maxSize = 1000
	private localStorage: Storage | null = null

	constructor() {
		// Check if localStorage is available
		try {
			if (typeof window !== 'undefined' && window.localStorage) {
				this.localStorage = window.localStorage
				this.loadFromLocalStorage()
			}
		} catch {
			console.warn('localStorage not available, using memory cache only')
		}

		// Periodic cleanup
		setInterval(() => this.cleanup(), 60000) // Every minute
	}

	private getCacheKey(type: string, key: string): string {
		return `${type}:${key}`
	}

	get<T>(type: string, key: string): T | null {
		const cacheKey = this.getCacheKey(type, key)
		const entry = this.memoryCache.get(cacheKey)

		if (!entry) {
			this.stats.misses++
			return null
		}

		const now = Date.now()
		if (now - entry.timestamp > entry.ttl * 1000) {
			// Expired
			this.memoryCache.delete(cacheKey)
			this.stats.misses++
			return null
		}

		this.stats.hits++
		return entry.data as T
	}

	set<T>(type: string, key: string, data: T, ttlSeconds: number): void {
		const cacheKey = this.getCacheKey(type, key)
		
		// Evict old entries if cache is full
		if (this.memoryCache.size >= this.maxSize) {
			this.evictOldest()
		}

		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl: ttlSeconds
		}

		this.memoryCache.set(cacheKey, entry)
		this.saveToLocalStorage(cacheKey, entry)
	}

	private evictOldest(): void {
		let oldestKey: string | null = null
		let oldestTime = Date.now()

		for (const [key, entry] of this.memoryCache.entries()) {
			if (entry.timestamp < oldestTime) {
				oldestTime = entry.timestamp
				oldestKey = key
			}
		}

		if (oldestKey) {
			this.memoryCache.delete(oldestKey)
			this.removeFromLocalStorage(oldestKey)
			this.stats.evictions++
		}
	}

	private cleanup(): void {
		const now = Date.now()
		const keysToDelete: string[] = []

		for (const [key, entry] of this.memoryCache.entries()) {
			if (now - entry.timestamp > entry.ttl * 1000) {
				keysToDelete.push(key)
			}
		}

		for (const key of keysToDelete) {
			this.memoryCache.delete(key)
			this.removeFromLocalStorage(key)
			this.stats.evictions++
		}
	}

	private saveToLocalStorage(key: string, entry: CacheEntry<any>): void {
		if (!this.localStorage) return

		try {
			// Store only essential quote data to save space
			if (key.startsWith('quote:')) {
				const storageKey = `ph_cache_${key}`
				const compactEntry = {
					d: entry.data, // data
					t: entry.timestamp, // timestamp
					e: entry.ttl // expiry (ttl)
				}
				this.localStorage.setItem(storageKey, JSON.stringify(compactEntry))
			}
		} catch (e) {
			// Quota exceeded or other error
			console.warn('Failed to save to localStorage:', e)
			this.clearOldLocalStorageItems()
		}
	}

	private removeFromLocalStorage(key: string): void {
		if (!this.localStorage) return

		try {
			this.localStorage.removeItem(`ph_cache_${key}`)
		} catch {
			// Ignore errors
		}
	}

	private loadFromLocalStorage(): void {
		if (!this.localStorage) return

		try {
			const keys = Object.keys(this.localStorage)
			const now = Date.now()

			for (const key of keys) {
				if (!key.startsWith('ph_cache_')) continue

				try {
					const stored = this.localStorage.getItem(key)
					if (!stored) continue

					const parsed = JSON.parse(stored)
					const cacheKey = key.replace('ph_cache_', '')

					// Check if still valid
					if (now - parsed.t <= parsed.e * 1000) {
						this.memoryCache.set(cacheKey, {
							data: parsed.d,
							timestamp: parsed.t,
							ttl: parsed.e
						})
					} else {
						// Remove expired items
						this.localStorage.removeItem(key)
					}
				} catch {
					// Remove corrupted items
					this.localStorage.removeItem(key)
				}
			}
		} catch {
			// Ignore errors
		}
	}

	private clearOldLocalStorageItems(): void {
		if (!this.localStorage) return

		try {
			const keys = Object.keys(this.localStorage)
			const cacheKeys = keys.filter(k => k.startsWith('ph_cache_'))
			
			// Sort by timestamp (embedded in key or parse from value)
			const items: Array<{ key: string; timestamp: number }> = []
			
			for (const key of cacheKeys) {
				try {
					const stored = this.localStorage.getItem(key)
					if (stored) {
						const parsed = JSON.parse(stored)
						items.push({ key, timestamp: parsed.t || 0 })
					}
				} catch {
					// Remove corrupted items
					this.localStorage.removeItem(key)
				}
			}

			// Sort by timestamp (oldest first)
			items.sort((a, b) => a.timestamp - b.timestamp)

			// Remove oldest 25% of items
			const toRemove = Math.floor(items.length * 0.25)
			for (let i = 0; i < toRemove; i++) {
				this.localStorage.removeItem(items[i].key)
			}
		} catch {
			// Ignore errors
		}
	}

	getStats(): CacheStats {
		return { ...this.stats }
	}

	clear(): void {
		this.memoryCache.clear()
		
		if (this.localStorage) {
			try {
				const keys = Object.keys(this.localStorage)
				for (const key of keys) {
					if (key.startsWith('ph_cache_')) {
						this.localStorage.removeItem(key)
					}
				}
			} catch {
				// Ignore errors
			}
		}

		this.stats = { hits: 0, misses: 0, evictions: 0 }
	}
}

// Singleton instance
export const cacheManager = new CacheManager()

// Helper functions for specific cache types
export function getCachedQuote(symbol: string): PriceQuote | null {
	return cacheManager.get<PriceQuote>('quote', symbol.toUpperCase())
}

export function setCachedQuote(quote: PriceQuote, ttlSeconds = 30): void {
	cacheManager.set('quote', quote.symbol.toUpperCase(), quote, ttlSeconds)
}

export function getCachedQuotes(symbols: string[]): Map<string, PriceQuote> {
	const results = new Map<string, PriceQuote>()
	
	for (const symbol of symbols) {
		const quote = getCachedQuote(symbol)
		if (quote) {
			results.set(symbol.toUpperCase(), quote)
		}
	}
	
	return results
}

export function setCachedQuotes(quotes: Map<string, PriceQuote>, ttlSeconds = 30): void {
	for (const [symbol, quote] of quotes.entries()) {
		setCachedQuote(quote, ttlSeconds)
	}
}
