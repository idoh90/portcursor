// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const POLY = Deno.env.get('POLYGON_API_KEY')

async function fetchNews(tickers: string[], limit = 50) {
  const q = encodeURIComponent(tickers.join(','))
  const url = `https://api.polygon.io/v2/reference/news?ticker.any_of=${q}&limit=${limit}&apiKey=${POLY}`
  const r = await fetch(url)
  if (!r.ok) return []
  const j = await r.json()
  const results = (j as any)?.results ?? []
  return results.map((n: any) => ({
    id: n.id ?? crypto.randomUUID(),
    title: n.title,
    source: n.publisher?.name ?? n.publisher?.title ?? 'Unknown',
    url: n.article_url ?? n.url,
    published_at: n.published_utc ?? n.published_at,
    tickers: (n.tickers ?? n.ticker_symbols ?? []).map((t: any) => typeof t === 'string' ? t : t.ticker),
    summary: n.description ?? n.summary ?? undefined,
  }))
}

serve(async (req) => {
  const u = new URL(req.url)
  const tickers = (u.searchParams.get('tickers') ?? 'SPY,QQQ,DIA').split(',').map(s => s.trim())
  const limit = Number(u.searchParams.get('limit') ?? '50')
  const data = await fetchNews(tickers, limit)
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' }})
})

