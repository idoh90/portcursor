// import { motion } from 'framer-motion'
import Card from '../ui/Card'
import { formatCurrency, formatPercent } from '../../lib/format'
import type { Investment } from '../../features/investments/types'
import type { PriceQuote } from '../../models/types'

interface InvestmentCardProps {
  investment: Investment
  quote?: PriceQuote | null
  onClick?: () => void
}

export default function InvestmentCard({ investment, quote, onClick }: InvestmentCardProps) {
  const isStale = !quote || quote.last == null
  const currentPrice = quote?.last || quote?.prevClose || 0
  const prevClose = quote?.prevClose || 0
  const todayChange = currentPrice - prevClose
  const todayChangePercent = prevClose ? (todayChange / prevClose) * 100 : 0

  // Calculate position metrics
  const totalQuantity = investment.lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const totalCost = investment.lots.reduce((sum, lot) => sum + (lot.quantity * lot.price + (lot.fees || 0)), 0)
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
  const currentValue = totalQuantity * currentPrice
  const unrealizedPnL = currentValue - totalCost
  const unrealizedPnLPercent = totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0

  const getTypeColor = (type: Investment['type']) => {
    switch (type) {
      case 'stock': return 'bg-blue-500/20 text-blue-300'
      case 'etf': return 'bg-purple-500/20 text-purple-300'
      case 'option': return 'bg-orange-500/20 text-orange-300'
      case 'crypto': return 'bg-yellow-500/20 text-yellow-300'
      case 'bond': return 'bg-green-500/20 text-green-300'
      case 'commodity': return 'bg-amber-500/20 text-amber-300'
      case 'real_estate': return 'bg-emerald-500/20 text-emerald-300'
      case 'cash': return 'bg-gray-500/20 text-gray-300'
      case 'custom': return 'bg-pink-500/20 text-pink-300'
      default: return 'bg-zinc-500/20 text-zinc-300'
    }
  }

  const getTypeLabel = (type: Investment['type']) => {
    switch (type) {
      case 'stock': return 'Stock'
      case 'etf': return 'ETF'
      case 'option': return 'Option'
      case 'crypto': return 'Crypto'
      case 'bond': return 'Bond'
      case 'commodity': return 'Commodity'
      case 'real_estate': return 'Real Estate'
      case 'cash': return 'Cash'
      case 'custom': return 'Custom'
      default: return String(type).toUpperCase()
    }
  }

  return (
    <div>
      <Card 
        className={`cursor-pointer transition-all hover:border-zinc-600 ${isStale ? 'opacity-70' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between p-4">
          {/* Left section - Symbol and type */}
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-white text-lg">{investment.symbol}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(investment.type)}`}>
                  {getTypeLabel(investment.type)}
                </span>
                {!investment.privacy.showPosition && (
                  <span className="text-zinc-500">🚫</span>
                )}
              </div>
              {investment.displayName && (
                <span className="text-sm text-zinc-400">{investment.displayName}</span>
              )}
              {investment.tags && investment.tags.length > 0 && (
                <div className="flex space-x-1 mt-1">
                  {investment.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-zinc-700 text-zinc-300 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {investment.tags.length > 3 && (
                    <span className="text-xs text-zinc-500">+{investment.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Center section - Quantity and avg cost */}
          <div className="flex flex-col items-center text-sm">
            <div className="text-zinc-400">Qty: {totalQuantity.toLocaleString()}</div>
            <div className="text-zinc-400">Avg: {formatCurrency(avgCost)}</div>
          </div>

          {/* Right section - Values and P&L */}
          <div className="flex flex-col items-end space-y-1">
            <div className="text-lg font-semibold text-white">
              {formatCurrency(currentValue)}
            </div>
            
            <div className={`text-sm font-medium flex items-center space-x-1 ${
              unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>{unrealizedPnL >= 0 ? '📈' : '📉'}</span>
              <span>{formatCurrency(unrealizedPnL)} ({formatPercent(unrealizedPnLPercent / 100)})</span>
            </div>

            <div className={`text-xs flex items-center space-x-1 ${
              todayChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>Today: {formatCurrency(todayChange)} ({formatPercent(todayChangePercent / 100)})</span>
            </div>

            {isStale && (
              <div className="text-xs text-zinc-500">Price stale</div>
            )}
          </div>

          {/* Actions menu */}
          <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors">
            <span className="text-zinc-400">⋮</span>
          </button>
        </div>

        {/* Option-specific info */}
        {investment.type === 'option' && (
          <div className="px-4 pb-3 pt-0 border-t border-zinc-800 mt-3">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>{investment.optionType?.toUpperCase()} ${investment.strike}</span>
              <span>Exp: {new Date(investment.expiration).toLocaleDateString()}</span>
              <span>{investment.contracts} contracts</span>
            </div>
          </div>
        )}

        {/* Real estate specific info */}
        {investment.type === 'real_estate' && (
          <div className="px-4 pb-3 pt-0 border-t border-zinc-800 mt-3">
            <div className="flex items-center justify-between text-sm text-zinc-400">
              <span>Equity: {investment.equityPercentage}%</span>
              {investment.monthlyRent && (
                <span>Rent: {formatCurrency(investment.monthlyRent)}/mo</span>
              )}
              {investment.capRate && (
                <span>Cap Rate: {formatPercent(investment.capRate / 100)}</span>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
