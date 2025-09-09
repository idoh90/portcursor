import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Dev stub API for /api/* when backend isn't running
    devApiStubs(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'PortfolioHub',
        short_name: 'PortfolioHub',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#111827',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html'
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    }
  },
})

function devApiStubs(): Plugin {
  const hasKeys = Boolean(process.env.POLYGON_API_KEY)
  return {
    name: 'dev-api-stubs',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        if (hasKeys) return next()
        try {
          if (req.url.startsWith('/api/market/snapshot')) {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify([
              { symbol: 'SPY', price: 500.12, changePctDay: 0.45, changePct30d: 3.2 },
              { symbol: 'QQQ', price: 420.55, changePctDay: -0.12, changePct30d: 4.8 },
              { symbol: 'DIA', price: 390.01, changePctDay: 0.20, changePct30d: 1.1 },
            ]))
            return
          }
          if (req.url.startsWith('/api/research/daily-brief')) {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({
              asOf: new Date().toISOString(),
              overviewBullets: [
                'Stocks mixed as yields steady',
                'Tech leads on AI optimism',
                'Crude slips on demand concerns',
              ],
              watchlist: ['NVDA','AAPL','MSFT','SPY'],
              keyStories: [
                { title: 'NVDA earnings today', takeaway: 'Volatility expected across semis' },
                { title: 'FOMC minutes', takeaway: 'Rates higher-for-longer narrative persists' },
              ]
            }))
            return
          }
          if (req.url.startsWith('/api/research/rankings')) {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify([
              { symbol: 'NVDA', momentum30d: 92, volumeSurge: 70, newsBuzz: 88, composite: 84 },
              { symbol: 'AAPL', momentum30d: 65, volumeSurge: 55, newsBuzz: 60, composite: 60 },
              { symbol: 'MSFT', momentum30d: 72, volumeSurge: 50, newsBuzz: 50, composite: 58 },
            ]))
            return
          }
          if (req.url.startsWith('/api/news/fetch')) {
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify([
              { id: '1', title: 'NVDA beats estimates', source: 'StubWire', url: 'https://example.com/1', published_at: new Date().toISOString(), tickers: ['NVDA'], summary: 'Strong data center demand' },
              { id: '2', title: 'AAPL unveils new model', source: 'StubWire', url: 'https://example.com/2', published_at: new Date().toISOString(), tickers: ['AAPL'], summary: 'Incremental upgrades' },
            ]))
            return
          }
        } catch {}
        next()
      })
    }
  }
}
