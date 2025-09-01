import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../features/settings/store'
import { usePriceStore } from '../../features/prices/store'
import { formatCurrency, formatPercent } from '../../lib/format'
import Card from '../ui/Card'

export default function PinnedRow() {
  const tickers = useSettingsStore(s => s.pinnedTickers)
  const baseCurrency = useSettingsStore(s => s.baseCurrency)
  const getPrice = usePriceStore(s => s.getPrice)
  const [rows, setRows] = useState<Array<{ s: string; price: number; dayPct: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const data: Array<{ s: string; price: number; dayPct: number }> = []
      for (const s of tickers) {
        const q = await getPrice(s)
        const dayPct = q.prevClose ? ((q.price - q.prevClose) / q.prevClose) * 100 : 0
        data.push({ s, price: q.price, dayPct })
      }
      if (!cancelled) { setRows(data); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [tickers])

  return (
    <Card head="Pinned">
      {loading ? (
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[64px] min-w-[120px] rounded-xl border border-zinc-800 bg-zinc-900/60" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-zinc-500">No pinned tickers</div>
      ) : (
        <div className="flex gap-2 overflow-x-auto">
          {rows.map((r) => {
            const pctClass = r.dayPct > 0 ? 'text-emerald-400' : r.dayPct < 0 ? 'text-red-400' : 'text-zinc-300'
            return (
              <div key={r.s} className="min-w-[120px] rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                <div className="text-sm font-semibold">{r.s}</div>
                <div className="text-xs text-zinc-400">{formatCurrency(r.price, baseCurrency)}</div>
                <div className={["text-xs", pctClass].join(' ')}>{formatPercent(r.dayPct)}</div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}


