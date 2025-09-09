import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useInvestmentsStore } from '../features/investments/store'
import { db } from '../services/db'
import { listPortfoliosByUser, createPortfolio } from '../services/repos/portfolioRepo'
import type { StockFormData } from '../schemas/investments/stock'
import type { Investment } from '../features/investments/types'

export function useUpsertStock() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { load: loadInvestments } = useInvestmentsStore()

  const upsertStock = async (stockData: StockFormData, editingId?: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Find or create user's main portfolio
      let portfolios = await listPortfoliosByUser(user.id)
      let mainPortfolio = portfolios.find(p => p.name === 'Main') || portfolios[0]
      
      if (!mainPortfolio) {
        const portfolioId = `pf-${user.id}-${crypto.randomUUID().slice(0, 8)}`
        mainPortfolio = await createPortfolio({
          id: portfolioId,
          userId: user.id,
          name: 'Main',
          currency: 'USD',
          visibility: 'public',
          pinnedSymbols: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      // Convert form data to Investment format
      const investment: Partial<Investment> = {
        type: 'stock',
        symbol: stockData.ticker,
        displayName: stockData.ticker, // Could be enhanced with company name lookup
        account: stockData.exchange,
        tags: [], // Could be derived from notes or user selection
        notes: stockData.notes,
        privacy: {
          showPosition: stockData.visibility !== 'private',
          showLots: stockData.visibility === 'public',
          showPnL: stockData.visibility === 'public',
        },
        lots: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Convert lots or average to lots format
      if (stockData.entryMode === 'lots' && stockData.lots) {
        investment.lots = stockData.lots.map(lot => ({
          id: `lot-${crypto.randomUUID().slice(0, 8)}`,
          quantity: lot.shares,
          price: lot.price,
          fees: lot.fees || 0,
          date: lot.date,
          notes: ''
        }))
      } else if (stockData.entryMode === 'average' && stockData.average) {
        // Create a single synthetic lot from average data
        investment.lots = [{
          id: `lot-${crypto.randomUUID().slice(0, 8)}`,
          quantity: stockData.average.totalShares,
          price: stockData.average.avgPrice,
          fees: stockData.average.totalFees || 0,
          date: new Date().toISOString().split('T')[0],
          notes: 'Average cost entry'
        }]
      }

      if (editingId) {
        // Update existing position
        const position = await db.positions.get(editingId)
        if (position) {
          await db.positions.update(editingId, {
            symbol: investment.symbol,
            updatedAt: investment.updatedAt,
          })

          // Clear existing lots and add new ones
          await db.lots.where('positionId').equals(editingId).delete()
          
          if (investment.lots && investment.lots.length > 0) {
            for (const lotData of investment.lots) {
              const lot = {
                id: lotData.id || `lot-${crypto.randomUUID().slice(0, 8)}`,
                positionId: editingId,
                side: 'buy' as const,
                quantity: lotData.quantity,
                price: lotData.price,
                fees: lotData.fees || 0,
                date: lotData.date,
              }
              await db.lots.add(lot)
            }
          }
        }
      } else {
        // Create new position
        const positionId = `pos-${stockData.ticker}-${crypto.randomUUID().slice(0, 8)}`
        const position = {
          id: positionId,
          portfolioId: mainPortfolio.id,
          symbol: stockData.ticker,
          type: 'stock' as const,
          status: 'open' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await db.positions.add(position)

        // Add lots
        if (investment.lots && investment.lots.length > 0) {
          for (const lotData of investment.lots) {
            const lot = {
              id: lotData.id || `lot-${crypto.randomUUID().slice(0, 8)}`,
              positionId,
              side: 'buy' as const,
              quantity: lotData.quantity,
              price: lotData.price,
              fees: lotData.fees || 0,
              date: lotData.date,
            }
            await db.lots.add(lot)
          }
        }
      }

      // Refresh investments store
      await loadInvestments()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save stock position'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    upsertStock,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}
