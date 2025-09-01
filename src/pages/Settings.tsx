import { useEffect, useState } from 'react'
import { getPrivacy, upsertPrivacy } from '../services/repos/privacyRepo'
import { listPortfoliosByUser } from '../services/repos/portfolioRepo'
import { reorderPinnedSymbols, togglePinnedSymbol } from '../services/repos/pinnedRepo'
import { exportUserDataJson, exportUserDataCsv, softDeleteUser, hardDeleteUser } from '../services/repos/dataRepo'
import { useAuthStore } from '../stores/authStore'
import { db } from '../services/db'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useSettingsStore } from '../features/settings/store'

function Settings() {
	const user = useAuthStore((s) => s.user)
	const [saving, setSaving] = useState(false)
	const updateDisplayName = useAuthStore((s) => s.updateDisplayName)
	const changePin = useAuthStore((s) => s.changePin)
	const logoutAllDevices = useAuthStore((s) => s.logoutAllDevices)
	const { baseCurrency, setBaseCurrency, locale, setLocale } = useSettingsStore()
	const [displayName, setDisplayName] = useState('')
	const [pinOld, setPinOld] = useState('')
	const [pinNew, setPinNew] = useState('')
	const [pinConfirm, setPinConfirm] = useState('')
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
		notifyDailyDigest: false,
		notifyAutoPostTypes: ['position_added','position_closed','big_move'] as Array<'position_added' | 'position_closed' | 'big_move'>,
		webhookDiscordUrl: '',
		webhookTelegramBot: '',
	})
	const [portfolioId, setPortfolioId] = useState<string | undefined>(undefined)
	const [pinned, setPinned] = useState<string[]>([])
	const [newPin, setNewPin] = useState('')

	useEffect(() => {
		if (!user) {
			console.log('No user found in Settings')
			return
		}
		console.log('Loading settings for user:', user.id)
		setDisplayName(user.displayName)
		getPrivacy(user.id).then((p) => {
			if (p) setForm((f) => ({ ...f, ...p }))
		})
		listPortfoliosByUser(user.id).then((ps) => {
			console.log('Found portfolios for user:', ps)
			const pf = ps[0]
			if (pf) {
				console.log('Setting portfolio ID:', pf.id, 'with pinned symbols:', pf.pinnedSymbols)
				setPortfolioId(pf.id)
				setPinned(pf.pinnedSymbols ?? [])
			} else {
				console.log('No portfolio found for user')
			}
		})
	}, [user?.id])

	const onSave = async () => {
		if (!user) return
		setSaving(true)
		await upsertPrivacy({ userId: user.id, ...form })
		setSaving(false)
	}

	const onChangeDisplayName = async () => {
		await updateDisplayName(displayName)
	}

	const onChangePin = async () => {
		await changePin(pinOld, pinNew, pinConfirm)
		setPinOld('')
		setPinNew('')
		setPinConfirm('')
	}

	const onTogglePin = async (symbol: string) => {
		if (!portfolioId) return
		const next = await togglePinnedSymbol(portfolioId, symbol.toUpperCase())
		setPinned(next)
	}

	const onAddPin = async () => {
		if (!newPin.trim()) {
			console.log('No symbol entered')
			return
		}
		if (!portfolioId) {
			console.log('No portfolio ID found')
			// Try to create a portfolio if none exists
			if (user) {
				console.log('Creating new portfolio for user:', user.id)
				try {
					const now = new Date().toISOString()
					const pfId = `pf-${user.id}-${Math.random().toString(36).slice(2, 8)}`
					const newPortfolio = {
						id: pfId,
						userId: user.id,
						name: 'Main',
						currency: 'USD' as const,
						visibility: 'public' as const,
						pinnedSymbols: [],
						createdAt: now,
						updatedAt: now
					}
					await db.portfolios.add(newPortfolio)
					setPortfolioId(pfId)
					console.log('Created portfolio:', pfId)
					// Now add the pin
					const next = await togglePinnedSymbol(pfId, newPin.trim().toUpperCase())
					setPinned(next)
					setNewPin('')
				} catch (e) {
					console.error('Error creating portfolio:', e)
				}
			}
			return
		}
		console.log('Adding pin:', newPin.trim().toUpperCase(), 'to portfolio:', portfolioId)
		try {
			const next = await togglePinnedSymbol(portfolioId, newPin.trim().toUpperCase())
			console.log('New pinned symbols:', next)
			setPinned(next)
			setNewPin('')
		} catch (e) {
			console.error('Error adding pin:', e)
		}
	}

	const movePin = async (index: number, delta: number) => {
		if (!portfolioId) return
		const i2 = index + delta
		if (i2 < 0 || i2 >= pinned.length) return
		const next = pinned.slice()
		const [it] = next.splice(index, 1)
		next.splice(i2, 0, it)
		await reorderPinnedSymbols(portfolioId, next)
		setPinned(next)
	}

	return (
		<div className="space-y-4 pb-16">
			<h1 className="text-xl font-semibold">Settings</h1>
			<Card className="space-y-3" head="Preferences">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Base currency</label>
					<select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={baseCurrency} onChange={(e) => setBaseCurrency(e.target.value as any)}>
						<option value="USD">USD</option>
						<option value="ILS">ILS</option>
					</select>
					<label>Locale</label>
					<select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={locale} onChange={(e) => setLocale(e.target.value as any)}>
						<option value="en">English</option>
						<option value="he">עברית</option>
					</select>
				</div>
			</Card>
			<Card className="space-y-3" head="Account">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Display name</label>
					<div className="flex gap-2">
						<Input className="flex-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
						<Button variant="secondary" size="sm" onClick={onChangeDisplayName}>Save</Button>
					</div>
					<label>Change PIN</label>
					<div className="grid grid-cols-3 gap-2">
						<Input type="password" placeholder="Current" value={pinOld} onChange={(e) => setPinOld(e.target.value)} />
						<Input type="password" placeholder="New" value={pinNew} onChange={(e) => setPinNew(e.target.value)} />
						<Input type="password" placeholder="Confirm" value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value)} />
						<Button className="col-span-3" variant="secondary" size="sm" onClick={onChangePin}>Update PIN</Button>
					</div>
					<label>Logout</label>
					<div>
						<Button variant="secondary" size="sm" onClick={logoutAllDevices}>Logout all devices</Button>
					</div>
				</div>
			</Card>
			<Card className="space-y-3" head="Privacy">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Portfolio visibility</label>
					<select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={form.portfolioVisibility} onChange={(e) => setForm((f) => ({ ...f, portfolioVisibility: e.target.value as any }))}>
						<option value="public">Public</option>
						<option value="friends">Friends</option>
						<option value="private">Private</option>
					</select>
					<label>Profile visibility</label>
					<select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={form.profileVisibility} onChange={(e) => setForm((f) => ({ ...f, profileVisibility: e.target.value as any }))}>
						<option value="public">Public</option>
						<option value="friends">Friends</option>
						<option value="private">Private</option>
					</select>
					<label>Hide from search (noindex)</label>
					<input type="checkbox" checked={form.noIndex} onChange={(e) => setForm((f) => ({ ...f, noIndex: e.target.checked }))} />
					<label>Big move threshold (%)</label>
					<Input type="number" min={0} max={100} value={form.bigMoveThresholdPercent} onChange={(e) => setForm((f) => ({ ...f, bigMoveThresholdPercent: Number(e.target.value) }))} />
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
				<Button onClick={onSave} disabled={saving} variant="primary" size="md">{saving ? 'Saving…' : 'Save'}</Button>
			</Card>
			<Card className="space-y-3" head="Data management">
				<div className="flex gap-2 text-sm">
					<Button variant="secondary" size="sm" onClick={async () => {
						if (!user) return
						const blob = await exportUserDataJson(user.id)
						const url = URL.createObjectURL(blob)
						const a = document.createElement('a')
						a.href = url
						a.download = 'portfoliohub-export.json'
						a.click()
						URL.revokeObjectURL(url)
					}}>Export JSON</Button>
					<Button variant="secondary" size="sm" onClick={async () => {
						if (!user) return
						const files = await exportUserDataCsv(user.id)
						for (const [name, blob] of files.entries()) {
							const url = URL.createObjectURL(blob)
							const a = document.createElement('a')
							a.href = url
							a.download = name
							a.click()
							URL.revokeObjectURL(url)
						}
					}}>Export CSV</Button>
				</div>
				<div className="flex gap-2 text-sm">
					<Button variant="secondary" size="sm" onClick={async () => {
						if (!user) return
						if (!confirm('Soft delete will hide your data and remove social posts. Continue?')) return
						await softDeleteUser(user.id)
					}}>Soft delete</Button>
					<Button variant="danger" size="sm" onClick={async () => {
						if (!user) return
						if (!confirm('Hard delete will permanently remove your data. This cannot be undone. Continue?')) return
						await hardDeleteUser(user.id)
					}}>Hard delete</Button>
				</div>
			</Card>
			<Card className="space-y-3" head="Notifications (stub)">
				<div className="grid grid-cols-2 gap-2 text-sm">
					<label>Daily digest</label>
					<input type="checkbox" checked={form.notifyDailyDigest} onChange={(e) => setForm((f) => ({ ...f, notifyDailyDigest: e.target.checked }))} />
					<label>Auto-post types</label>
					<div className="flex gap-2 text-xs">
						{(['position_added','position_closed','big_move'] as const).map((t) => (
							<label key={t} className="flex items-center gap-1"><input type="checkbox" checked={form.notifyAutoPostTypes.includes(t)} onChange={(e) => setForm((f) => ({ ...f, notifyAutoPostTypes: e.target.checked ? Array.from(new Set([...f.notifyAutoPostTypes, t])) : f.notifyAutoPostTypes.filter((x) => x !== t) }))} />{t}</label>
						))}
					</div>
					<label>Discord webhook URL</label>
					<Input placeholder="https://discord.com/api/webhooks/..." value={form.webhookDiscordUrl} onChange={(e) => setForm((f) => ({ ...f, webhookDiscordUrl: e.target.value }))} />
					<label>Telegram bot token</label>
					<Input placeholder="12345:ABC..." value={form.webhookTelegramBot} onChange={(e) => setForm((f) => ({ ...f, webhookTelegramBot: e.target.value }))} />
				</div>
			</Card>
			<Card className="space-y-3" head="Pinned tickers">
				{!user && (
					<div className="text-sm text-red-400">Please log in to manage pinned tickers</div>
				)}
				{user && !portfolioId && (
					<div className="text-sm text-yellow-400">No portfolio found. Adding a ticker will create one.</div>
				)}
				{user && portfolioId && (
					<div className="text-xs text-zinc-500">Portfolio: {portfolioId}</div>
				)}
				<div className="flex gap-2 text-sm">
					<Input 
						placeholder="Add ticker (e.g. AAPL)" 
						value={newPin} 
						onChange={(e) => setNewPin(e.target.value.toUpperCase())} 
						disabled={!user}
					/>
					<Button variant="secondary" size="sm" onClick={onAddPin} disabled={!user || !newPin.trim()}>Add</Button>
				</div>
				<div className="space-y-2">
					{pinned.map((s, i) => (
						<div key={s} className="flex items-center justify-between text-sm rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-1">
							<div className="font-medium">{s}</div>
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="sm" onClick={() => movePin(i, -1)} disabled={i === 0}>↑</Button>
								<Button variant="ghost" size="sm" onClick={() => movePin(i, 1)} disabled={i === pinned.length - 1}>↓</Button>
								<Button variant="ghost" size="sm" onClick={() => onTogglePin(s)}>Unpin</Button>
							</div>
						</div>
					))}
				</div>
			</Card>
		</div>
	)
}

export default Settings


