import { useNews } from '@/state/newsSlice'

export function TodayBrief() {
  const { brief, status } = useNews()
  if (status === 'loading' && !brief) {
    return <div className="skeleton h-24 rounded-lg my-2" />
  }
  if (!brief) return null

  return (
    <section className="mt-2">
      <h2 className="text-sm font-medium mb-1">Today's Brief</h2>
      <div className="rounded-lg border border-zinc-800 p-3">
        <div className="text-xs text-zinc-400 mb-2">As of {new Date(brief.asOf).toLocaleString()}</div>
        <ul className="list-disc ml-4 text-sm space-y-1">
          {brief.overviewBullets.slice(0,5).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        {brief.watchlist?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {brief.watchlist.slice(0,6).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{t}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

