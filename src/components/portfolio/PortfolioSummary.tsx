import Card from '../ui/Card'

export interface PortfolioTotals {
	totalUnrealized: number
	totalRealized: number
	totalToday: number
}

function formatCurrency(value: number) {
	const signClass = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-zinc-200'
	return { text: `$${value.toFixed(2)}`, signClass }
}

export default function PortfolioSummary({ totals }: { totals: PortfolioTotals }) {
	const u = formatCurrency(totals.totalUnrealized)
	const r = formatCurrency(totals.totalRealized)
	const t = formatCurrency(totals.totalToday)
	return (
		<Card>
			<div className="grid grid-cols-3 gap-2">
				<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
					<div className="text-xs text-zinc-400">Unrealized</div>
					<div className={["font-semibold", u.signClass].join(' ')}>{u.text}</div>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
					<div className="text-xs text-zinc-400">Realized</div>
					<div className={["font-semibold", r.signClass].join(' ')}>{r.text}</div>
				</div>
				<div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-center">
					<div className="text-xs text-zinc-400">Today</div>
					<div className={["font-semibold", t.signClass].join(' ')}>{t.text}</div>
				</div>
			</div>
		</Card>
	)
}


