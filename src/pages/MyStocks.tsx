import { useEffect, useMemo, useState } from 'react'
import { db } from '../services/db'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'
import Card from '../components/ui/Card'
import PositionCard from '../components/portfolio/PositionCard'

function MyStocks() {
	const [positions, setPositions] = useState<{ id: string; symbol: string }[]>([])
	const [lotsByPosition, setLotsByPosition] = useState<Record<string, any[]>>({})
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
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">My Stocks</h1>
			<div className="space-y-2">
				{positions.length === 0 ? (
					<Card className="text-sm text-zinc-500">No positions yet</Card>
				) : (
					positions.map((p) => {
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


