// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const POLY = Deno.env.get("POLYGON_API_KEY")

async function fetchClose(symbol: string) {
  const to = new Date().toISOString().slice(0,10)
  const from = new Date(Date.now() - 31*864e5).toISOString().slice(0,10)
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=120&apiKey=${POLY}`
  const r = await fetch(url)
  if (!r.ok) return null
  const j = await r.json()
  return (j as any)?.results ?? []
}

serve(async (req) => {
  const u = new URL(req.url)
  const tickers = (u.searchParams.get("tickers") ?? "SPY,QQQ,DIA").split(",")
  const out: any[] = []
  for (const t of tickers) {
    const rows = await fetchClose(t.trim())
    if (!rows?.length) continue
    const last = rows[rows.length-1]
    const prev = rows[rows.length-2] ?? last
    const first = rows[0]

    const price = last.c
    const changePctDay = ((last.c - prev.c) / prev.c) * 100
    const changePct30d = ((last.c - first.c) / first.c) * 100

    out.push({ symbol: t, price, changePctDay, changePct30d })
  }
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" }})
})

