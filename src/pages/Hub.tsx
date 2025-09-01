import { useEffect, useMemo, useState } from 'react'
import { db } from '../services/db'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePortfolioMetrics } from '../services/positions/plEngine'
import { postBigMoveIfNeeded } from '../services/repos/bigMoveRepo'
import Card from '../components/ui/Card'
import PortfolioSummary from '../components/portfolio/PortfolioSummary'
import Pinned from '../components/portfolio/PinnedTickers'
import FriendsStrip from '../components/hub/FriendsStrip'
import FeedPreview from '../components/hub/FeedPreview'
import Button from '../components/ui/Button'
import AddPositionDrawer from '../components/portfolio/AddPositionDrawer'

function Hub() {
	const [positions, setPositions] = useState<any[]>([])
	const [lotsByPos, setLotsByPos] = useState<Record<string, any[]>>({})
	const [portfolio, setPortfolio] = useState<any | null>(null)
	const [openAdd, setOpenAdd] = useState(false)
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
			const q = quotes.get(p.symbol) as any
			if (!q || q.last == null || q.prevClose == null || q.prevClose === 0) continue
			const pct = ((q.last - q.prevClose) / q.prevClose) * 100
			postBigMoveIfNeeded(portfolio.id, p.symbol, pct).catch(() => {})
		}
	}, [positions, quotes, portfolio?.id])
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">Hub</h1>
			<PortfolioSummary totals={totals as any} />
			<Pinned symbols={portfolio?.pinnedSymbols ?? []} />
			<Card head="Friends">
				<FriendsStrip />
			</Card>
			<FeedPreview />
			<Button className="fixed bottom-20 right-6 h-12 w-12 rounded-full shadow-lg" onClick={() => setOpenAdd(true)}>+</Button>
			<AddPositionDrawer open={openAdd} onOpenChange={setOpenAdd} />
		</div>
	)
}

export default Hub


