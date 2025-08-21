import Card from '../ui/Card'

export default function PinnedTickers({ symbols }: { symbols: string[] }) {
	return (
		<Card head="Pinned">
			<div className="flex flex-wrap gap-2">
				{symbols.length ? symbols.map((s) => (
					<div key={s} className="rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm">{s}</div>
				)) : <div className="text-sm text-zinc-500">No pinned tickers</div>}
			</div>
		</Card>
	)
}


