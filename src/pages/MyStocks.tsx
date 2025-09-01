import { useEffect, useMemo, useState } from 'react'
import { db } from '../services/db'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'
import Card from '../components/ui/Card'
import PositionCard from '../components/portfolio/PositionCard'
import Input from '../components/ui/Input'

function MyStocks() {
	const [positions, setPositions] = useState<{ id: string; symbol: string }[]>([])
	const [lotsByPosition, setLotsByPosition] = useState<Record<string, any[]>>({})
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState<'symbol' | 'value' | 'pnl'>('symbol')
	useEffect(() => {
		db.positions.toArray().then((ps) => setPositions(ps.map((p) => ({ id: p.id, symbol: p.symbol }))))
	}, [])
	useEffect(() => {
		Promise.all(
			positions.map((p) => db.lots.where('positionId').equals(p.id).toArray().then((ls) => [p.id, ls] as const))
		).then((entries) => setLotsByPosition(Object.fromEntries(entries)))
	}, [positions])
	const symbols = useMemo(() => positions.map((p) => p.symbol), [positions])
	const quotes = useQuotesBatch(symbols)

	const filteredSorted = useMemo(() => {
		const q = search.trim().toLowerCase()
		let list = q ? positions.filter((p) => p.symbol.toLowerCase().includes(q)) : positions.slice()
		if (sort === 'symbol') {
			list.sort((a, b) => a.symbol.localeCompare(b.symbol))
			return list
		}
		// Compute value and pnl for sorting using existing metrics helper
		function metricsFor(id: string, symbol: string) {
			const lots = lotsByPosition[id] ?? []
			const quote = quotes.get(symbol)
			if (!quote) return { value: 0, pnl: 0 }
			const m = computePositionMetrics(lots, { last: quote.last, prevClose: quote.prevClose }, 'FIFO') as any
			const qty = m?.quantity ?? 0
			const price = quote.last ?? quote.prevClose ?? 0
			const value = qty * (price ?? 0)
			const pnl = m?.unrealizedPL ?? 0
			return { value, pnl }
		}
		list.sort((a, b) => {
			const ma = metricsFor(a.id, a.symbol)
			const mb = metricsFor(b.id, b.symbol)
			return sort === 'value' ? mb.value - ma.value : mb.pnl - ma.pnl
		})
		return list
	}, [positions, lotsByPosition, quotes, search, sort])
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">My Stocks</h1>
			<div className="flex gap-2">
				<Input placeholder="Search symbol" value={search} onChange={(e) => setSearch(e.target.value)} />
				<select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
					<option value="symbol">A–Z</option>
					<option value="value">By Value</option>
					<option value="pnl">By P/L</option>
				</select>
			</div>
			<div className="space-y-2">
				{filteredSorted.length === 0 ? (
					<Card className="text-sm text-zinc-500">No positions yet</Card>
				) : (
					filteredSorted.map((p) => {
						const quote = quotes.get(p.symbol)
						const lots = lotsByPosition[p.id] ?? []
						const metrics = quote ? computePositionMetrics(lots, { last: quote.last, prevClose: quote.prevClose }, 'FIFO') : null
						return (
							<PositionCard
								key={p.id}
								symbol={p.symbol}
								quantity={metrics?.quantity ?? null}
								avgCost={metrics?.avgCost ?? null}
								unrealized={metrics?.unrealizedPL ?? null}
								today={metrics?.todayChange ?? null}
								isStale={!quote || quote.last == null}
							/>
						)
					})
				)}
			</div>
		</div>
	)
}

export default MyStocks


