import { useEffect, useMemo, useState } from 'react'
import { db } from '../services/db'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'

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
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">My Stocks</h1>
			<div className="space-y-2">
				{positions.length === 0 ? (
					<div className="rounded-lg border p-3 text-sm text-gray-500">No positions yet</div>
				) : (
					positions.map((p) => {
						const quote = quotes.get(p.symbol)
						const lots = lotsByPosition[p.id] ?? []
						const metrics = quote ? computePositionMetrics(lots, { last: quote.last, prevClose: quote.prevClose }, 'FIFO') : null
						return (
							<div key={p.id} className="rounded border p-2 flex items-center justify-between">
								<div className="font-medium">{p.symbol}</div>
								<div className="text-sm">Qty: {metrics?.quantity ?? '-'}</div>
								<div className="text-sm">Avg: {metrics?.avgCost?.toFixed?.(2) ?? '-'}</div>
								<div className="text-sm">Unreal: {metrics ? metrics.unrealizedPL.toFixed(2) : '-'}</div>
								<div className="text-sm">Today: {metrics ? metrics.todayChange.toFixed(2) : '-'}</div>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}

export default MyStocks


