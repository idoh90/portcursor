import { useNews } from '@/state/newsSlice'

export default function MarketSnapshot() {
  const { snapshot, status } = useNews()

  if (status === 'loading' && !snapshot.length) {
    return <div className="skeleton h-16 rounded-lg my-2" />
  }

  if (!snapshot.length) return null

  return (
    <section className="mt-4">
      <h2 className="text-sm font-medium mb-2">Market Snapshot</h2>
      <div className="grid grid-cols-3 gap-2">
        {snapshot.map((s) => (
          <div key={s.symbol} className="rounded-lg border border-zinc-800 p-2">
            <div className="text-xs text-zinc-400">{s.symbol}</div>
            <div className="text-lg font-semibold">{s.price?.toFixed(2)}</div>
            <div className={s.changePctDay >= 0 ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>
              {s.changePctDay.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}