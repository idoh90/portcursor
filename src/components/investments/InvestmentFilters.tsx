import { useInvestmentsStore } from '../../features/investments/store'
import Button from '../ui/Button'
import Card from '../ui/Card'

export default function InvestmentFilters() {
  const { filters, setFilters } = useInvestmentsStore()

  const handleClearFilters = () => {
    setFilters({
      types: [],
      tags: [],
      accounts: [],
      showWatchlistOnly: false,
      showGainersOnly: false,
      showLosersOnly: false,
    })
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-white">Filters</h3>
        <Button variant="ghost" size="sm" onClick={handleClearFilters}>
          Clear All
        </Button>
      </div>

      <div className="text-sm text-zinc-400">
        Advanced filtering functionality coming soon!
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.showWatchlistOnly}
            onChange={(e) => setFilters({ showWatchlistOnly: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-700 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm text-zinc-300">Watchlist only</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.showGainersOnly}
            onChange={(e) => setFilters({ showGainersOnly: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-700 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-sm text-zinc-300">Gainers only</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.showLosersOnly}
            onChange={(e) => setFilters({ showLosersOnly: e.target.checked })}
            className="rounded border-zinc-600 bg-zinc-700 text-red-500 focus:ring-red-500"
          />
          <span className="text-sm text-zinc-300">Losers only</span>
        </label>
      </div>
    </Card>
  )
}