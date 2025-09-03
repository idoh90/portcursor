import { useState } from 'react'
import { useNews } from '@/state/newsSlice'

const tabs = [
  { key: 'momentum', label: 'Momentum (30D)' },
  { key: 'volume', label: 'Volume Surge' },
  { key: 'buzz', label: 'News Buzz' },
  { key: 'composite', label: 'Composite' },
] as const

type TabKey = typeof tabs[number]['key']

export default function ResearchRankings() {
  const [active, setActive] = useState<TabKey>('momentum')
  const { rankings, loadRankings } = useNews()

  const rows = rankings
    .slice()
    .sort((a, b) => {
      if (active === 'momentum') return b.momentum30d - a.momentum30d
      if (active === 'volume') return b.volumeSurge - a.volumeSurge
      if (active === 'buzz') return b.newsBuzz - a.newsBuzz
      return b.composite - a.composite
    })
    .slice(0, 10)

  return (
    <section className="mt-6">
      <div className="flex space-x-2 overflow-x-auto pb-2 text-xs">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActive(t.key)
              loadRankings()
            }}
            className={['px-3 py-1 rounded-full', active === t.key ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-300'].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>
      <ul className="mt-2 divide-y divide-zinc-800 text-sm">
        {rows.map((r, idx) => (
          <li key={r.symbol} className="flex items-center py-1">
            <span className="w-6 text-right mr-2 text-xs text-zinc-500">{idx + 1}</span>
            <span className="w-14 font-medium">{r.symbol}</span>
            <span className="text-zinc-400 text-xs flex-1">
              {active === 'momentum'
                ? r.momentum30d.toFixed(1)
                : active === 'volume'
                ? r.volumeSurge.toFixed(1)
                : active === 'buzz'
                ? r.newsBuzz.toFixed(1)
                : r.composite.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}