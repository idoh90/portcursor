// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
function scale01to100(v: number) { return clamp(Math.round(v * 100), 0, 100) }

serve(async (req) => {
  const u = new URL(req.url)
  const universe = u.searchParams.get('universe') ?? 'holdings'
  const limit = Number(u.searchParams.get('limit') ?? '20')
  // Stub universe for now
  const tickers = universe === 'all' ? ['SPY','QQQ','DIA','NVDA','AAPL','MSFT','AMZN','META'] : ['NVDA','AAPL','MSFT','SPY','QQQ']
  // Generate simple synthetic metrics deterministically
  const rows = tickers.map((s, i) => {
    const momentum = scale01to100(0.4 + 0.05 * Math.sin(i))
    const volume = scale01to100(0.5 + 0.3 * Math.cos(i))
    const buzz = scale01to100(0.4 + 0.4 * Math.abs(Math.sin(i/2)))
    const composite = clamp(Math.round(momentum*0.4 + volume*0.3 + buzz*0.3), 0, 100)
    return { symbol: s, momentum30d: momentum, volumeSurge: volume, newsBuzz: buzz, composite }
  }).slice(0, limit)

  return new Response(JSON.stringify(rows), { headers: { 'content-type': 'application/json' }})
})

