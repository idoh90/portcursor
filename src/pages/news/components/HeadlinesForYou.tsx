import { useNews } from '@/state/newsSlice'

export default function HeadlinesForYou() {
  const { headlines, status } = useNews()

  if (status === 'loading' && !headlines.length) {
    return <div className="skeleton h-24 rounded-lg my-2" />
  }

  if (!headlines.length) return null

  return (
    <section className="mt-6">
      <h2 className="text-sm font-medium mb-2">Headlines for You</h2>
      <ul className="space-y-3">
        {headlines.map((h) => (
          <li key={h.id} className="rounded-lg border border-zinc-800 p-3">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{h.source}</span>
              <span>{new Date(h.published_at).toLocaleTimeString()}</span>
            </div>
            <a href={h.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
              {h.title}
            </a>
            {h.summary ? <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{h.summary}</p> : null}
            <div className="mt-2 flex flex-wrap gap-1 text-xs">
              {h.tickers.map((t) => (
                <span key={t} className="rounded-full bg-zinc-800 px-2 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}