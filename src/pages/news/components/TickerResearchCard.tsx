import type { MarketCard } from '@/types/research'

interface Props {
  open: boolean
  onClose: () => void
  ticker: string
  snapshot?: MarketCard
}

export function TickerResearchCard({ open, onClose, ticker, snapshot }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
      <div className="w-full max-w-md mx-auto bg-zinc-950 border-t border-zinc-800 rounded-t-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{ticker}</div>
          <button onClick={onClose} className="text-zinc-400">Close</button>
        </div>
        <div className="mt-2 text-sm text-zinc-300">
          <div className="flex items-center gap-3">
            <div>Price: {snapshot?.price?.toFixed(2) ?? '-'}</div>
            <div>Day: {snapshot ? `${snapshot.changePctDay.toFixed(2)}%` : '-'}</div>
          </div>
          <div className="mt-3 text-xs text-zinc-400">Why it's moving, quick stats, catalysts, related (stubs)</div>
        </div>
      </div>
    </div>
  )
}

