# portcursor

Dev runbook

- Install: npm i
- Dev: npm run dev
- Test: npm test
- Lint: npm run lint
- Build: npm run build

## News & Research

- Route `/news` provides: Today’s Brief, Market Snapshot, Research Rankings, Headlines.
- Offline cache via Dexie at `src/db/newsDexie.ts`.
- Zustand slice at `src/state/newsSlice.ts`; types in `src/types/research.ts`.

Env vars (not committed):

- `POLYGON_API_KEY` (required for live)
- `ALPHAVANTAGE_API_KEY` (optional)

During `npm run dev`, stub API responses are served if no keys are set for:

- `/api/market/snapshot`
- `/api/research/daily-brief`
- `/api/research/rankings`
- `/api/news/fetch`

Supabase Edge Functions (Deno) in `supabase/functions` mirror these endpoints.

Feature flags

- Edit `src/services/flags.ts` or call `setFlags({ pricingDbCache: false })` at app start.

How P/L works

- Realized: FIFO via `computeRealizedPLFIFO`
- Unrealized: qty * (price - avg cost) via `computeUnrealizedPL`

CI/CD (suggested)

- On PR: lint, typecheck, test; preview deploy
- Protect main; add smoke tests and rollback plan