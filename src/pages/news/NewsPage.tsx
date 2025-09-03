import { useEffect } from 'react'
import { useNews } from '@/state/newsSlice'
import TodayBrief from './components/TodayBrief'
import MarketSnapshot from './components/MarketSnapshot'
import ResearchRankings from './components/ResearchRankings'
import HeadlinesForYou from './components/HeadlinesForYou'

export default function NewsPage() {
  const { loadBrief, loadSnapshot, loadRankings, loadHeadlines } = useNews()

  useEffect(() => {
    // fire and forget parallel
    loadBrief()
    loadSnapshot()
    loadRankings()
    loadHeadlines()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur px-1 py-3">
        <h1 className="text-xl font-semibold">News & Research</h1>
        <p className="text-xs text-zinc-400">Auto-refreshed. Works offline with cached data.</p>
      </header>

      <TodayBrief />
      <MarketSnapshot />
      <ResearchRankings />
      <HeadlinesForYou />
    </div>
  )
}