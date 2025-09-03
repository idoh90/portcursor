// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

serve(async () => {
  const now = new Date()
  const brief = {
    asOf: now.toISOString(),
    overviewBullets: [
      'Markets mixed as investors digest earnings',
      'Semiconductors outperform on AI demand',
      'Energy lags with crude under pressure',
    ],
    watchlist: ['SPY','QQQ','DIA','NVDA','AAPL','MSFT'],
    keyStories: [
      { title: 'Key mega-cap earnings', takeaway: 'Implied vol elevated; watch guidance tone' },
      { title: 'Macro data on deck', takeaway: 'Inflation prints steer rate expectations' },
    ]
  }
  return new Response(JSON.stringify(brief), { headers: { 'content-type': 'application/json' }})
})

