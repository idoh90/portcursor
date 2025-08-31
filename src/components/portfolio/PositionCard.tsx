import Card from '../ui/Card'

export interface PositionCardProps {
	symbol: string
	quantity?: number | null
	avgCost?: number | null
	unrealized?: number | null
	today?: number | null
	isStale?: boolean
}

export default function PositionCard({ symbol, quantity, avgCost, unrealized, today, isStale }: PositionCardProps) {
	const unrealClass = (unrealized ?? 0) > 0 ? 'text-emerald-400' : (unrealized ?? 0) < 0 ? 'text-red-400' : 'text-zinc-200'
	const todayClass = (today ?? 0) > 0 ? 'text-emerald-400' : (today ?? 0) < 0 ? 'text-red-400' : 'text-zinc-200'
	return (
		<Card className={[isStale ? 'opacity-70' : 'opacity-100'].join(' ')}>
			<div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
				<div className="font-medium text-zinc-200 mr-auto">{symbol}</div>
				<div className="text-sm text-zinc-400">Qty: {quantity ?? '-'}</div>
				<div className="text-sm text-zinc-400">Avg: {avgCost != null ? avgCost.toFixed(2) : '-'}</div>
				<div className={["text-sm", unrealClass].join(' ')}>Unreal: {unrealized != null ? unrealized.toFixed(2) : '-'}</div>
				<div className={["text-sm", todayClass].join(' ')}>Today: {today != null ? today.toFixed(2) : '-'}</div>
			</div>
			{isStale ? <div className="mt-1 text-xs text-zinc-500">Price stale</div> : null}
		</Card>
	)
}


