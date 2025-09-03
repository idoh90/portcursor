import { useState } from 'react'
import { useNews } from '@/state/newsSlice'

const tabs: Array<{ key: 'momentum'|'volume'|'buzz'|'composite'; label: string }> = [
  { key: 'momentum', label: 'Momentum (30D)' },
  { key: 'volume', label: 'Volume Surge' },
  { key: 'buzz', label: 'News Buzz' },
  { key: 'composite', label: 'Composite' },
]

export function ResearchRankings() {
  const { rankings } = useNews()
  const [tab, setTab] = useState<'momentum'|'volume'|'buzz'|'composite'>('momentum')

  if (!rankings?.length) return <div className="skeleton h-28 rounded-lg my-2" />

  const sorted = [...rankings].sort((a, b) => {
    switch (tab) {
      case 'momentum': return (b.momentum30d ?? 0) - (a.momentum30d ?? 0)
      case 'volume': return (b.volumeSurge ?? 0) - (a.volumeSurge ?? 0)
      case 'buzz': return (b.newsBuzz ?? 0) - (a.newsBuzz ?? 0)
      case 'composite': return (b.composite ?? 0) - (a.composite ?? 0)
    }
  }).slice(0, 10)

  return (
    <section className="mt-4">
      <div className="flex gap-2 text-xs mb-2 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={[
            'px-2 py-1 rounded-full border border-zinc-800 whitespace-nowrap',
            tab === t.key ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300'
          ].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 overflow-hidden">
        {sorted.map((r, idx) => (
          <div key={r.symbol} className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <div className="w-6 text-xs text-zinc-400">#{idx+1}</div>
              <div className="font-semibold">{r.symbol}</div>
            </div>
            <div className="text-xs text-zinc-300">
              {tab === 'momentum' && `${(r.momentum30d ?? 0).toFixed(0)}`}
              {tab === 'volume' && `${(r.volumeSurge ?? 0).toFixed(0)}`}
              {tab === 'buzz' && `${(r.newsBuzz ?? 0).toFixed(0)}`}
              {tab === 'composite' && `${(r.composite ?? 0).toFixed(0)}`}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

