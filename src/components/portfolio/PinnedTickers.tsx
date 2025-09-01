import { useEffect, useState } from 'react'
import { useQuotesBatch } from '../../hooks/useQuotes'
import { useSettingsStore } from '../../features/settings/store'
import { formatCurrency, formatPercent } from '../../lib/format'
import { computePositionMetrics } from '../../services/positions/plEngine'
import { db } from '../../services/db'
import Card from '../ui/Card'

type PinnedData = {
	symbol: string
	price: number
	dayPct: number
	unrealizedPL?: number
	todayChange?: number
	hasPosition: boolean
}

export default function PinnedTickers({ symbols }: { symbols: string[] }) {
	const baseCurrency = useSettingsStore(s => s.baseCurrency)
	const quotes = useQuotesBatch(symbols)
	const [pinnedData, setPinnedData] = useState<PinnedData[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (!symbols.length || quotes.size === 0) {
			setLoading(false)
			return
		}

		const loadPositionData = async () => {
			const data: PinnedData[] = []
			
			for (const symbol of symbols) {
				const quote = quotes.get(symbol)
				if (!quote) continue

				const price = quote.last ?? quote.prevClose ?? 0
				const dayPct = quote.prevClose ? ((price - quote.prevClose) / quote.prevClose) * 100 : 0

				// Check if user has a position in this symbol
				const position = await db.positions.where('symbol').equals(symbol).first()
				let unrealizedPL: number | undefined
				let todayChange: number | undefined
				let hasPosition = false

				if (position) {
					hasPosition = true
					const lots = await db.lots.where('positionId').equals(position.id).toArray()
					const metrics = computePositionMetrics(lots, quote)
					unrealizedPL = metrics.unrealizedPL
					todayChange = metrics.todayChange * metrics.quantity
				}

				data.push({
					symbol,
					price,
					dayPct,
					unrealizedPL,
					todayChange,
					hasPosition
				})
			}
			
			setPinnedData(data)
			setLoading(false)
		}

		loadPositionData()
	}, [symbols, quotes])

	if (loading) {
		return (
			<Card head="Pinned">
				<div className="flex gap-2 overflow-x-auto">
					{symbols.map((_, i) => (
						<div key={i} className="h-[80px] min-w-[140px] rounded-xl border border-zinc-800 bg-zinc-900/60 animate-pulse" />
					))}
				</div>
			</Card>
		)
	}

	if (!symbols.length) {
		return (
			<Card head="Pinned">
				<div className="text-sm text-zinc-500">
					No pinned tickers. Add them in <span className="text-zinc-300 font-medium">Settings</span> to track your favorite stocks.
				</div>
			</Card>
		)
	}

	return (
		<Card head="Pinned">
			<div className="flex gap-2 overflow-x-auto">
				{pinnedData.map((data) => {
					const pctClass = data.dayPct > 0 ? 'text-emerald-400' : data.dayPct < 0 ? 'text-red-400' : 'text-zinc-300'
					const plClass = data.unrealizedPL && data.unrealizedPL > 0 ? 'text-emerald-400' : 
									data.unrealizedPL && data.unrealizedPL < 0 ? 'text-red-400' : 'text-zinc-400'
					const todayClass = data.todayChange && data.todayChange > 0 ? 'text-emerald-400' : 
									   data.todayChange && data.todayChange < 0 ? 'text-red-400' : 'text-zinc-400'
					
					return (
						<div key={data.symbol} className="min-w-[140px] rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
							<div className="text-sm font-semibold flex items-center justify-between">
								{data.symbol}
								{data.hasPosition && <div className="w-2 h-2 bg-emerald-400 rounded-full" />}
							</div>
							<div className="text-xs text-zinc-400 mb-1">{formatCurrency(data.price, baseCurrency)}</div>
							<div className={["text-xs", pctClass].join(' ')}>{formatPercent(data.dayPct)}</div>
							{data.hasPosition && data.unrealizedPL !== undefined && (
								<div className={["text-xs mt-1", plClass].join(' ')}>
									P/L: {formatCurrency(data.unrealizedPL, baseCurrency)}
								</div>
							)}
							{data.hasPosition && data.todayChange !== undefined && (
								<div className={["text-xs", todayClass].join(' ')}>
									Today: {formatCurrency(data.todayChange, baseCurrency)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</Card>
	)
}


