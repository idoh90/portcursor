import { useParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useViewerStore } from '../stores/viewerStore'
import { db } from '../services/db'
import { useEffect, useMemo, useState } from 'react'
import { useQuotesBatch } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'
import type { PrivacySettings } from '../models/types'
import { getPrivacy } from '../services/repos/privacyRepo'

function Profile() {
	const { name } = useParams()
	const authUser = useAuthStore((s) => s.user)
	const { isOwner, setOwner, setViewingUserId } = useViewerStore()
	const [userId, setUserId] = useState<string | undefined>(undefined)
	const [privacy, setPrivacy] = useState<PrivacySettings | undefined>(undefined)
	const [positions, setPositions] = useState<any[]>([])
	const [lotsByPos, setLotsByPos] = useState<Record<string, any[]>>({})

	const viewingOwnProfile = !!authUser && authUser.displayName.toLowerCase() === String(name).toLowerCase()
	if (isOwner !== viewingOwnProfile) {
		setOwner(viewingOwnProfile)
	}
	if (authUser && !isOwner) {
		setViewingUserId(authUser.id)
	}
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
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Public Profile</h1>
			<div className="rounded-lg border p-3">Profile for {name}</div>
			<div className="text-sm text-gray-600">Mode: {isOwner ? 'Owner' : 'Viewer'}</div>
			{!privacy?.showPositions ? (
				<div className="rounded border p-3 text-sm text-gray-500">Positions are hidden</div>
			) : (
				<div className="space-y-2">
					{positions.map((p) => {
						const lots = lotsByPos[p.id] ?? []
						const quote = quotes.get(p.symbol)
						const metrics = quote ? computePositionMetrics(lots, { last: quote.last, prevClose: quote.prevClose }, 'FIFO') : null
						return (
							<div key={p.id} className="rounded border p-2 flex items-center gap-3 text-sm">
								<div className="font-medium">{p.symbol}</div>
								{privacy?.showQuantity ? <div>Qty: {metrics?.quantity ?? '-'}</div> : null}
								{privacy?.showAvgCost ? <div>Avg: {metrics?.avgCost?.toFixed?.(2) ?? '-'}</div> : null}
								{privacy?.showRealizedPL ? <div>Realized: {metrics ? metrics.realizedPL.toFixed(2) : '-'}</div> : null}
								{privacy?.showTodayChange ? <div>Today: {metrics ? metrics.todayChange.toFixed(2) : '-'}</div> : null}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

export default Profile


