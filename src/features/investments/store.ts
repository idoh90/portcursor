import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { Investment, InvestmentFilters, InvestmentDraft } from './types'
import { db } from '../../services/db'
import { useAuthStore } from '../../stores/authStore'
import { listPortfoliosByUser } from '../../services/repos/portfolioRepo'
import { createPortfolio } from '../../services/repos/portfolioRepo'
import { getQuotesBatched } from '../../services/pricing/priceService'
import { computePositionMetrics } from '../../services/positions/plEngine'

// Simple adapter to convert existing positions to Investment format
const convertPositionToInvestment = (position: any): Investment => {
  return {
    id: position.id,
    type: position.type || 'stock',
    symbol: position.symbol,
    displayName: position.displayName,
    account: position.account,
    tags: position.tags || [],
    notes: position.notes,
    privacy: position.privacy || {
      showPosition: true,
      showLots: true,
      showPnL: true,
    },
    lots: position.lots || [],
    createdAt: position.createdAt || new Date().toISOString(),
    updatedAt: position.updatedAt || new Date().toISOString(),
    currentValue: 0,
    unrealizedPnL: 0,
    realizedPnL: 0,
    todayChange: 0,
    avgCost: 0,
    totalQuantity: 0,
  }
}

interface InvestmentsState {
  // Core data
  investments: Investment[]
  isLoading: boolean
  error: string | null

  // Computed values
  totalValue: number
  totalPnL: number
  todayChange: number

  // UI state
  searchQuery: string
  filters: InvestmentFilters
  selectedInvestments: string[]

  // Draft management
  drafts: Record<string, InvestmentDraft>

  // Actions
  load: () => Promise<void>
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateInvestment: (id: string, updates: Partial<Investment>) => Promise<void>
  deleteInvestment: (id: string) => Promise<void>
  
  // UI actions
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<InvestmentFilters>) => void
  setSelectedInvestments: (ids: string[]) => void
  
  // Draft actions
  saveDraft: (draftId: string, draft: InvestmentDraft) => void
  loadDraft: (draftId: string) => InvestmentDraft | null
  clearDraft: (draftId: string) => void
  
  // Bulk operations
  bulkUpdate: (ids: string[], updates: Partial<Investment>) => Promise<void>
  bulkDelete: (ids: string[]) => Promise<void>
}

export const useInvestmentsStore = create<InvestmentsState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    investments: [],
    isLoading: false,
    error: null,
    totalValue: 0,
    totalPnL: 0,
    todayChange: 0,
    searchQuery: '',
    filters: {
      types: [],
      tags: [],
      accounts: [],
      showWatchlistOnly: false,
      showGainersOnly: false,
      showLosersOnly: false,
    },
    selectedInvestments: [],
    drafts: {},

    // Load investments from database
    async load() {
      set({ isLoading: true, error: null })
      try {
        // Get current user
        const currentUser = useAuthStore.getState().user
        if (!currentUser) {
          set({ 
            investments: [], 
            totalValue: 0, 
            totalPnL: 0, 
            todayChange: 0, 
            isLoading: false 
          })
          return
        }

        // Get user's portfolios
        const portfolios = await listPortfoliosByUser(currentUser.id)
        const portfolioIds = portfolios.map(p => p.id)
        
        // Load positions from user's portfolios only
        const allPositions = await db.positions.toArray()
        const userPositions = allPositions.filter(p => portfolioIds.includes(p.portfolioId))
        
        // Load lots for each position and get price data
        const symbols = userPositions.map(p => p.symbol)
        const quotes = symbols.length > 0 ? await getQuotesBatched(symbols) : new Map()
        
        const investmentsWithLots = await Promise.all(
          userPositions.map(async (position) => {
            const lots = await db.lots.where('positionId').equals(position.id).toArray()
            const investment = convertPositionToInvestment(position)
            investment.lots = lots.map(lot => ({
              id: lot.id,
              quantity: lot.quantity,
              price: lot.price,
              fees: lot.fees || 0,
              date: lot.date,
              notes: ''
            }))

            // Calculate metrics using price data
            const quote = quotes.get(position.symbol)
            if (quote && lots.length > 0) {
              const metrics = computePositionMetrics(lots, { 
                last: quote.last, 
                prevClose: quote.prevClose 
              }, 'FIFO')
              
              investment.currentValue = metrics.quantity * (quote.last ?? quote.prevClose ?? 0)
              investment.unrealizedPnL = metrics.unrealizedPL
              investment.todayChange = metrics.todayChange * metrics.quantity
              investment.avgCost = metrics.avgCost
              investment.totalQuantity = metrics.quantity
            }
            
            return investment
          })
        )
        
        const investments = investmentsWithLots
        
        // Calculate totals
        const totalValue = investments.reduce((sum, inv) => sum + (inv.currentValue || 0), 0)
        const totalPnL = investments.reduce((sum, inv) => sum + (inv.unrealizedPnL || 0), 0)
        const todayChange = investments.reduce((sum, inv) => sum + (inv.todayChange || 0), 0)

        set({ 
          investments, 
          totalValue, 
          totalPnL, 
          todayChange, 
          isLoading: false 
        })
      } catch (error) {
        console.error('Failed to load investments:', error)
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load investments',
          isLoading: false,
          investments: [] // Set empty array on error
        })
      }
    },

    // Add new investment
    async addInvestment(investmentData) {
      try {
        // Get current user
        const currentUser = useAuthStore.getState().user
        if (!currentUser) {
          throw new Error('User not authenticated')
        }

        // Find or create user's main portfolio
        let portfolios = await listPortfoliosByUser(currentUser.id)
        let mainPortfolio = portfolios.find(p => p.name === 'Main') || portfolios[0]
        
        if (!mainPortfolio) {
          // Create a main portfolio for the user
          const portfolioId = `pf-${currentUser.id}-${crypto.randomUUID().slice(0, 8)}`
          mainPortfolio = await createPortfolio({
            id: portfolioId,
            userId: currentUser.id,
            name: 'Main',
            currency: 'USD',
            visibility: 'public',
            pinnedSymbols: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }

        // Create position
        const positionId = `pos-${investmentData.symbol}-${crypto.randomUUID().slice(0, 8)}`
        const position = {
          id: positionId,
          portfolioId: mainPortfolio.id,
          symbol: investmentData.symbol,
          type: investmentData.type || 'stock',
          status: 'open' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await db.positions.add(position)

        // Create lots from investment data
        if (investmentData.lots && investmentData.lots.length > 0) {
          for (const lotData of investmentData.lots) {
            const lot = {
              id: lotData.id || `lot-${crypto.randomUUID().slice(0, 8)}`,
              positionId,
              side: 'buy' as const,
              quantity: lotData.quantity,
              price: lotData.price,
              fees: lotData.fees || 0,
              date: lotData.date,
            }
            await db.lots.add(lot)
          }
        }

        // Reload investments to get updated data
        get().load()
      } catch (error) {
        console.error('Failed to add investment:', error)
        set({ error: error instanceof Error ? error.message : 'Failed to add investment' })
        throw error
      }
    },

    // Update investment
    async updateInvestment(id, updates) {
      try {
        const updatedInvestment = {
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        // TODO: Use proper repository
        await db.positions.update(id, updatedInvestment)
        
        set(state => ({
          investments: state.investments.map(inv => 
            inv.id === id ? { ...inv, ...updatedInvestment } : inv
          )
        }))

        // Recalculate totals
        get().load()
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to update investment' })
      }
    },

    // Delete investment
    async deleteInvestment(id) {
      try {
        // TODO: Use proper repository
        await db.positions.delete(id)
        
        set(state => ({
          investments: state.investments.filter(inv => inv.id !== id)
        }))

        // Recalculate totals
        get().load()
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to delete investment' })
      }
    },

    // UI actions
    setSearchQuery: (query) => set({ searchQuery: query }),
    
    setFilters: (newFilters) => set(state => ({
      filters: { ...state.filters, ...newFilters }
    })),
    
    setSelectedInvestments: (ids) => set({ selectedInvestments: ids }),

    // Draft management
    saveDraft: (draftId, draft) => {
      set(state => ({
        drafts: { ...state.drafts, [draftId]: draft }
      }))
      
      // Save to IndexedDB for persistence
      localStorage.setItem(`investment_draft_${draftId}`, JSON.stringify(draft))
    },

    loadDraft: (draftId) => {
      const state = get()
      if (state.drafts[draftId]) {
        return state.drafts[draftId]
      }

      // Try loading from localStorage
      try {
        const saved = localStorage.getItem(`investment_draft_${draftId}`)
        if (saved) {
          const draft = JSON.parse(saved)
          set(state => ({
            drafts: { ...state.drafts, [draftId]: draft }
          }))
          return draft
        }
      } catch (error) {
        console.warn('Failed to load draft from localStorage:', error)
      }

      return null
    },

    clearDraft: (draftId) => {
      set(state => {
        const { [draftId]: removed, ...remaining } = state.drafts
        return { drafts: remaining }
      })
      localStorage.removeItem(`investment_draft_${draftId}`)
    },

    // Bulk operations
    async bulkUpdate(ids, updates) {
      try {
        const updatedAt = new Date().toISOString()
        
        // TODO: Use proper repository with transaction
        await Promise.all(
          ids.map(id => db.positions.update(id, { ...updates, updatedAt }))
        )
        
        set(state => ({
          investments: state.investments.map(inv => 
            ids.includes(inv.id) ? { ...inv, ...updates, updatedAt } : inv
          )
        }))

        get().load()
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to bulk update investments' })
      }
    },

    async bulkDelete(ids) {
      try {
        // TODO: Use proper repository with transaction
        await Promise.all(ids.map(id => db.positions.delete(id)))
        
        set(state => ({
          investments: state.investments.filter(inv => !ids.includes(inv.id))
        }))

        get().load()
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to bulk delete investments' })
      }
    },
  }))
)

// Auto-save drafts periodically
setInterval(() => {
  const state = useInvestmentsStore.getState()
  Object.entries(state.drafts).forEach(([draftId, draft]) => {
    localStorage.setItem(`investment_draft_${draftId}`, JSON.stringify(draft))
  })
}, 30000) // Save every 30 seconds
