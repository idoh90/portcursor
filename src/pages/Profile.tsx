import { Link, useParams } from 'react-router-dom'
import Sparkline from '../components/Sparkline'
import { useAuthStore } from '../stores/authStore'
import { useViewerStore } from '../stores/viewerStore'
import { db } from '../services/db'
import { useEffect, useMemo, useState } from 'react'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'
import type { PrivacySettings } from '../models/types'
import { getPrivacy } from '../services/repos/privacyRepo'
import Card from '../components/ui/Card'

function Profile() {
	const { name } = useParams()
	const authUser = useAuthStore((s) => s.user)
	const { isOwner, setOwner, setViewingUserId } = useViewerStore()
	const [userId, setUserId] = useState<string | undefined>(undefined)
	const [privacy, setPrivacy] = useState<PrivacySettings | undefined>(undefined)
	const [positions, setPositions] = useState<any[]>([])
	const [lotsByPos, setLotsByPos] = useState<Record<string, any[]>>({})

	const viewingOwnProfile = !!authUser && authUser.displayName.toLowerCase() === String(name).toLowerCase()
	useEffect(() => {
		setOwner(viewingOwnProfile)
	}, [viewingOwnProfile, setOwner])
	useEffect(() => {
		if (authUser) setViewingUserId(authUser.id)
	}, [authUser?.id, setViewingUserId])
	useEffect(() => {
		// Resolve profile user id from displayName
		db.users.where('displayName').equalsIgnoreCase(String(name ?? '')).first().then((u) => {
			setUserId(u?.id)
			if (u?.id) getPrivacy(u.id).then(setPrivacy)
		})
	}, [name])

	useEffect(() => {
		if (!userId) return
		db.portfolios.where('userId').equals(userId).first().then(async (pf) => {
			if (!pf) return
			const ps = await db.positions.where('portfolioId').equals(pf.id).toArray()
			setPositions(ps)
			const entries = await Promise.all(ps.map((p) => db.lots.where('positionId').equals(p.id).toArray().then((ls) => [p.id, ls] as const)))
			setLotsByPos(Object.fromEntries(entries))
		})
	}, [userId])

	const symbols = useMemo(() => positions.map((p) => p.symbol), [positions])
	const quotes = useQuotesBatch(symbols)
	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">Public Profile</h1>
			<Card>Profile for {name}</Card>
			<div className="flex items-center justify-between text-sm text-zinc-500">
				<div>Mode: {isOwner ? 'Owner' : 'Viewer'}</div>
				<div>{isOwner ? <Link className="underline" to="/settings">Edit privacy</Link> : null}</div>
			</div>
			{privacy?.noIndex ? <div className="text-xs text-zinc-600">noindex</div> : null}
			{(privacy?.portfolioVisibility === 'private' && !isOwner) ? null : (
				<PinnedTickers userId={userId} />
			)}
			{(privacy?.portfolioVisibility === 'private' && !isOwner) ? (
				<Card className="text-sm text-zinc-500">This profile is private.</Card>
			) : !privacy?.showPositions ? (
				<Card className="text-sm text-zinc-500">Positions are hidden</Card>
			) : (
				<div className="space-y-2">
					{positions.map((p) => {
						const lots = lotsByPos[p.id] ?? []
						const quote = quotes.get(p.symbol)
						const metrics = quote ? computePositionMetrics(lots, { last: quote.last, prevClose: quote.prevClose }, 'FIFO') : null
						return (
							<Card key={p.id} className="flex items-center gap-3 text-sm">
								<div className="font-medium">{p.symbol}</div>
								{privacy?.showQuantity ? <div>Qty: {metrics?.quantity ?? '-'}</div> : null}
								{privacy?.showAvgCost ? <div>Avg: {metrics?.avgCost?.toFixed?.(2) ?? '-'}</div> : null}
								{privacy?.showRealizedPL ? <div>Realized: {metrics ? metrics.realizedPL.toFixed(2) : '-'}</div> : null}
								{privacy?.showTodayChange ? <div>Today: {metrics ? metrics.todayChange.toFixed(2) : '-'}</div> : null}
							</Card>
						)
					})}
				</div>
			)}
		</div>
	)
}

function PinnedTickers({ userId }: { userId?: string }) {
	const [symbols, setSymbols] = useState<string[]>([])
	useEffect(() => {
		if (!userId) return
		db.portfolios.where('userId').equals(userId).first().then((pf) => setSymbols(pf?.pinnedSymbols ?? []))
	}, [userId])
	if (!symbols.length) return null
	return (
		<Card head="Pinned">
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
				{symbols.map((s) => (
					<div key={s} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1 text-sm">
						<div className="font-medium mr-2">{s}</div>
						<div className="text-zinc-500"><Sparkline symbol={s} windowDays={7} /></div>
					</div>
				))}
			</div>
		</Card>
	)
}

export default Profile


