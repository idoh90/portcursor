import { demoPinned, demoPosts } from '../services/fixtures'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../services/db'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePortfolioMetrics } from '../services/positions/plEngine'
import { postBigMoveIfNeeded } from '../services/repos/bigMoveRepo'

function Hub() {
	const [positions, setPositions] = useState<any[]>([])
	const [lotsByPos, setLotsByPos] = useState<Record<string, any[]>>({})
	const [portfolio, setPortfolio] = useState<any | null>(null)
	useEffect(() => {
		db.portfolios.toArray().then((pfs) => setPortfolio(pfs[0] ?? null))
		db.positions.toArray().then(setPositions)
	}, [])
	useEffect(() => {
		Promise.all(
			positions.map((p) => db.lots.where('positionId').equals(p.id).toArray().then((ls) => [p.id, ls] as const))
		).then((entries) => setLotsByPos(Object.fromEntries(entries)))
	}, [positions])
	const symbols = useMemo(() => positions.map((p) => p.symbol), [positions])
	const quotes = useQuotesBatch(symbols)
	const totals = useMemo(() => {
		if (!portfolio) return { totalUnrealized: 0, totalRealized: 0, totalToday: 0 }
		const items = positions.map((p) => ({ position: p, lots: lotsByPos[p.id] ?? [], quote: quotes.get(p.symbol) ?? { last: null, prevClose: null } }))
		return computePortfolioMetrics(items as any, portfolio)
	}, [positions, lotsByPos, quotes, portfolio])
	useEffect(() => {
		if (!portfolio) return
		for (const p of positions) {
			const q = quotes.get(p.symbol)
			if (!q || q.last == null || q.prevClose == null || q.prevClose === 0) continue
			const pct = ((q.last - q.prevClose) / q.prevClose) * 100
			postBigMoveIfNeeded(portfolio.id, p.symbol, pct).catch(() => {})
		}
	}, [positions, quotes, portfolio?.id])
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">Hub</h1>
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-lg border p-3 text-center">
					<div className="text-xs text-gray-500">Unrealized</div>
					<div className="font-semibold">${totals.totalUnrealized.toFixed(2)}</div>
				</div>
				<div className="rounded-lg border p-3 text-center">
					<div className="text-xs text-gray-500">Realized</div>
					<div className="font-semibold">${totals.totalRealized.toFixed(2)}</div>
				</div>
				<div className="rounded-lg border p-3 text-center">
					<div className="text-xs text-gray-500">Today</div>
					<div className="font-semibold">${totals.totalToday.toFixed(2)}</div>
				</div>
			</div>
			<div className="rounded-lg border p-3">
				<div className="mb-2 text-sm font-medium">Pinned</div>
				<div className="flex gap-2">
					{(portfolio?.pinnedSymbols ?? []).map((s) => (
						<div key={s} className="rounded-md border px-3 py-2 text-sm">{s}</div>
					))}
					{(portfolio?.pinnedSymbols?.length ?? 0) === 0 && <div className="text-sm text-gray-500">No pinned tickers</div>}
				</div>
			</div>
			<div className="rounded-lg border p-3">
				<div className="mb-2 text-sm font-medium">Latest posts</div>
				<ul className="space-y-1 text-sm">
					{/* For brevity, still using demo. Social page shows full feed. */}
					{demoPosts.map((p) => (
						<li key={p.id} className="flex items-center justify-between">
							<span>{p.displayName}</span>
							<span className="text-gray-500">{p.symbol}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

export default Hub


