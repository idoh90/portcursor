import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useInvestmentsStore } from '../features/investments/store'
import { db } from '../services/db'
import { listPortfoliosByUser, createPortfolio } from '../services/repos/portfolioRepo'
import type { CustomFormData } from '../schemas/investments/custom'

export function useUpsertCustom() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuthStore()
  const { load: loadInvestments } = useInvestmentsStore()

  const upsertCustom = async (customData: CustomFormData, editingId?: string) => {
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

      if (editingId) {
        // Update existing position
        const position = await db.positions.get(editingId)
        if (position) {
          // Store custom instrument data in position notes (as JSON)
          await db.positions.update(editingId, {
            symbol: customData.definition.slug || customData.definition.label,
            type: 'custom',
            updatedAt: new Date().toISOString(),
            // Store the full custom data as metadata
            metadata: JSON.stringify(customData)
          })

          // Clear existing lots and add new ones
          await db.lots.where('positionId').equals(editingId).delete()
          
          // Convert custom lots to standard lots
          if (customData.definition.entryMode === 'lots' && customData.state.lots) {
            for (const lotData of customData.state.lots) {
              const lot = {
                id: `lot-${crypto.randomUUID().slice(0, 8)}`,
                positionId: editingId,
                side: 'buy' as const,
                quantity: lotData.quantity,
                price: lotData.unitCost,
                fees: lotData.fees || 0,
                date: lotData.date,
              }
              await db.lots.add(lot)
            }
          } else if (customData.definition.entryMode === 'average' && customData.state.average) {
            // Create a synthetic lot from average data
            const lot = {
              id: `lot-${crypto.randomUUID().slice(0, 8)}`,
              positionId: editingId,
              side: 'buy' as const,
              quantity: customData.state.average.totalQuantity,
              price: customData.state.average.avgUnitCost,
              fees: customData.state.average.totalFees || 0,
              date: new Date().toISOString().split('T')[0],
            }
            await db.lots.add(lot)
          }
        }
      } else {
        // Create new position
        const positionId = `pos-custom-${crypto.randomUUID().slice(0, 8)}`
        const position = {
          id: positionId,
          portfolioId: mainPortfolio.id,
          symbol: customData.definition.slug || customData.definition.label,
          type: 'custom' as const,
          status: 'open' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Store the full custom data as metadata
          metadata: JSON.stringify(customData)
        }

        await db.positions.add(position)

        // Add lots
        if (customData.definition.entryMode === 'lots' && customData.state.lots) {
          for (const lotData of customData.state.lots) {
            const lot = {
              id: `lot-${crypto.randomUUID().slice(0, 8)}`,
              positionId,
              side: 'buy' as const,
              quantity: lotData.quantity,
              price: lotData.unitCost,
              fees: lotData.fees || 0,
              date: lotData.date,
            }
            await db.lots.add(lot)
          }
        } else if (customData.definition.entryMode === 'average' && customData.state.average) {
          // Create a synthetic lot from average data
          const lot = {
            id: `lot-${crypto.randomUUID().slice(0, 8)}`,
            positionId,
            side: 'buy' as const,
            quantity: customData.state.average.totalQuantity,
            price: customData.state.average.avgUnitCost,
            fees: customData.state.average.totalFees || 0,
            date: new Date().toISOString().split('T')[0],
          }
          await db.lots.add(lot)
        }
      }

      // Refresh investments store
      await loadInvestments()

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save custom instrument'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    upsertCustom,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}
