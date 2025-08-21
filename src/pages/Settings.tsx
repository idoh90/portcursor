import { useEffect, useState } from 'react'
import { getPrivacy, upsertPrivacy } from '../services/repos/privacyRepo'
import { useAuthStore } from '../stores/authStore'

function Settings() {
	const user = useAuthStore((s) => s.user)
	const [saving, setSaving] = useState(false)
	const [form, setForm] = useState({
		portfolioVisibility: 'public' as 'public' | 'private' | 'friends',
		profileVisibility: 'public' as 'public' | 'private' | 'friends',
		showPositions: true,
		showLots: true,
		showDividends: true,
		showQuantity: true,
		showAvgCost: true,
		showRealizedPL: true,
		showTodayChange: true,
		noIndex: false,
		bigMoveThresholdPercent: 5,
	})

	useEffect(() => {
		if (!user) return
		getPrivacy(user.id).then((p) => {
			if (p) setForm((f) => ({ ...f, ...p }))
		})
	}, [user?.id])

	const onSave = async () => {
		if (!user) return
		setSaving(true)
		await upsertPrivacy({ userId: user.id, ...form })
		setSaving(false)
	}

	return (
		<div className="space-y-4">
			<h1 className="text-xl font-semibold">Settings</h1>
			<div className="rounded-lg border p-3 space-y-3">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Portfolio visibility</label>
					<select className="rounded border px-2 py-1" value={form.portfolioVisibility} onChange={(e) => setForm((f) => ({ ...f, portfolioVisibility: e.target.value as any }))}>
						<option value="public">Public</option>
						<option value="friends">Friends</option>
						<option value="private">Private</option>
					</select>
					<label>Profile visibility</label>
					<select className="rounded border px-2 py-1" value={form.profileVisibility} onChange={(e) => setForm((f) => ({ ...f, profileVisibility: e.target.value as any }))}>
						<option value="public">Public</option>
						<option value="friends">Friends</option>
						<option value="private">Private</option>
					</select>
					<label>Hide from search (noindex)</label>
					<input type="checkbox" checked={form.noIndex} onChange={(e) => setForm((f) => ({ ...f, noIndex: e.target.checked }))} />
					<label>Big move threshold (%)</label>
					<input className="rounded border px-2 py-1" type="number" min={0} max={100} value={form.bigMoveThresholdPercent} onChange={(e) => setForm((f) => ({ ...f, bigMoveThresholdPercent: Number(e.target.value) }))} />
				</div>
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Show positions</label>
					<input type="checkbox" checked={form.showPositions} onChange={(e) => setForm((f) => ({ ...f, showPositions: e.target.checked }))} />
					<label>Show lots</label>
					<input type="checkbox" checked={form.showLots} onChange={(e) => setForm((f) => ({ ...f, showLots: e.target.checked }))} />
					<label>Show dividends</label>
					<input type="checkbox" checked={form.showDividends} onChange={(e) => setForm((f) => ({ ...f, showDividends: e.target.checked }))} />
					<label>Show quantity</label>
					<input type="checkbox" checked={form.showQuantity} onChange={(e) => setForm((f) => ({ ...f, showQuantity: e.target.checked }))} />
					<label>Show avg cost</label>
					<input type="checkbox" checked={form.showAvgCost} onChange={(e) => setForm((f) => ({ ...f, showAvgCost: e.target.checked }))} />
					<label>Show realized P/L</label>
					<input type="checkbox" checked={form.showRealizedPL} onChange={(e) => setForm((f) => ({ ...f, showRealizedPL: e.target.checked }))} />
					<label>Show today change</label>
					<input type="checkbox" checked={form.showTodayChange} onChange={(e) => setForm((f) => ({ ...f, showTodayChange: e.target.checked }))} />
				</div>
				<button onClick={onSave} disabled={saving} className="rounded bg-black px-4 py-2 text-white text-sm">{saving ? 'Saving…' : 'Save'}</button>
			</div>
		</div>
	)
}

export default Settings


