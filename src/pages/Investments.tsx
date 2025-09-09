import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import AddInvestmentWizard from '../components/investments/AddInvestmentWizard'
import { useInvestmentsStore } from '../features/investments/store'
import { formatCurrency } from '../lib/format'

export default function Investments() {
  const { 
    investments, 
    isLoading, 
    totalValue, 
    totalPnL, 
    todayChange, 
    searchQuery,
    setSearchQuery,
    load 
  } = useInvestmentsStore()
  
  const [showAddWizard, setShowAddWizard] = useState(false)
  const navigate = useNavigate()

  // Load investments on mount
  useEffect(() => {
    load()
  }, [load])

  const filteredInvestments = investments.filter(inv =>
    !searchQuery || inv.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-16">
      {/* Header with portfolio summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Investments</h1>
          <Button onClick={() => setShowAddWizard(true)} className="flex items-center gap-2">
            ➕ Add Investment
          </Button>
        </div>

        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Total Value</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(totalValue)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Total P&L</div>
            <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalPnL)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Today's Change</div>
            <div className={`text-2xl font-bold flex items-center gap-1 ${todayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {todayChange >= 0 ? '📈' : '📉'}
              {formatCurrency(todayChange)}
            </div>
          </Card>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400">🔍</span>
          <Input
            placeholder="Search investments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Investments List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-zinc-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredInvestments.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-zinc-400 mb-4">
              {searchQuery ? 'No investments found' : 'No investments yet'}
            </div>
            <Button onClick={() => setShowAddWizard(true)}>
              Add Your First Investment
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredInvestments.map((investment) => (
              <Card 
                key={investment.id} 
                className="p-4 cursor-pointer hover:border-zinc-600 transition-colors"
                onClick={() => navigate(`/position/${investment.id}`)}
              >
                <div className="flex items-center justify-between">
                  {/* Left section - Symbol and type */}
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-lg">{investment.symbol}</span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {investment.type.toUpperCase()}
                        </span>
                      </div>
                      {investment.displayName && (
                        <span className="text-sm text-zinc-400">{investment.displayName}</span>
                      )}
                    </div>
                  </div>

                  {/* Right section - Values and P&L */}
                  <div className="flex flex-col items-end space-y-1">
                    <div className="text-lg font-semibold text-white">
                      {formatCurrency(investment.currentValue || 0)}
                    </div>
                    
                    <div className={`text-sm font-medium flex items-center space-x-1 ${
                      (investment.unrealizedPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      <span>{(investment.unrealizedPnL || 0) >= 0 ? '📈' : '📉'}</span>
                      <span>{formatCurrency(investment.unrealizedPnL || 0)}</span>
                    </div>

                    <div className={`text-xs flex items-center space-x-1 ${
                      (investment.todayChange || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      <span>Today: {formatCurrency(investment.todayChange || 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Investment Wizard */}
      <AddInvestmentWizard 
        isOpen={showAddWizard} 
        onClose={() => setShowAddWizard(false)} 
      />
    </div>
  )
}