import { useNews } from '@/state/newsSlice'

export default function TodayBrief() {
  const { brief, status } = useNews()

  if (status === 'loading' && !brief) {
    return <div className="skeleton h-20 rounded-lg my-2" />
  }

  if (!brief) return null

  return (
    <section className="mt-4">
      <h2 className="text-sm font-medium mb-2">Today&apos;s Brief – {new Date(brief.asOf).toLocaleDateString()}</h2>
      <ul className="list-disc pl-5 text-sm space-y-1">
        {brief.overviewBullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      {brief.watchlist?.length ? (
        <div className="mt-2 flex flex-wrap gap-1 text-xs">
          {brief.watchlist.map((t) => (
            <span key={t} className="rounded-full bg-zinc-800 px-2 py-0.5">
              {t}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}