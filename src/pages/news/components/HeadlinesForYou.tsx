import { useNews } from '@/state/newsSlice'

export function HeadlinesForYou() {
  const { headlines } = useNews()
  if (!headlines?.length) return <div className="skeleton h-24 rounded-lg my-2" />

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium">Headlines for You</h2>
      </div>
      <div className="space-y-2">
        {headlines.slice(0, 20).map(h => (
          <a key={h.id} href={h.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-zinc-800 p-3 hover:bg-zinc-900">
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span>{h.source}</span>
              <span>•</span>
              <span>{new Date(h.published_at).toLocaleString()}</span>
            </div>
            <div className="text-sm font-medium mt-1">{h.title}</div>
            {h.summary ? <div className="text-xs text-zinc-300 mt-1 line-clamp-2">{h.summary}</div> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {h.tickers?.slice(0,6).map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full bg-zinc-800 text-xs">{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

