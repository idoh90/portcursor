# portcursor

Dev runbook

- Install: npm i
- Dev: npm run dev
- Test: npm test
- Lint: npm run lint
- Build: npm run build

Feature flags

- Edit `src/services/flags.ts` or call `setFlags({ pricingDbCache: false })` at app start.

How P/L works

- Realized: FIFO via `computeRealizedPLFIFO`
- Unrealized: qty * (price - avg cost) via `computeUnrealizedPL`

CI/CD (suggested)

- On PR: lint, typecheck, test; preview deploy
- Protect main; add smoke tests and rollback plan