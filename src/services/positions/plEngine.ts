import type { Lot, Position, Portfolio } from '../../models/types'
import { computeRealizedPLFIFO, computeUnrealizedPL, computeWeightedAverageCost } from '../repos/plHelpers'

export type PositionMetrics = {
	quantity: number
	avgCost: number
	realizedPL: number
	unrealizedPL: number
	todayChange: number
}

export function computeRealizedPLAVG(lots: Lot[]): number {
	// Average cost method: realized P/L computed using running average cost at time of sale
	let totalQty = 0
	let totalCost = 0
	let realized = 0
	for (const l of lots) {
		if (l.side === 'buy') {
			totalCost += l.quantity * l.price + (l.fees ?? 0)
			totalQty += l.quantity
		} else {
			if (totalQty <= 0) continue
			const avg = totalCost / totalQty
			realized += l.quantity * (l.price - avg)
			totalQty -= l.quantity
			totalCost = avg * totalQty
		}
	}
	return realized
}

export function computePositionMetrics(
	lots: Lot[],
	quote: { last: number | null; prevClose: number | null },
	costMethod: 'FIFO' | 'AVG' = 'FIFO',
	multiplier: number = 1
): PositionMetrics {
	const { totalQuantity, weightedAvgCost } = computeWeightedAverageCost(lots)
	const last = quote.last ?? quote.prevClose ?? 0
	const todayChange = quote.prevClose != null && last != null ? (last - quote.prevClose) * multiplier : 0
	const baseUnreal = totalQuantity > 0 ? computeUnrealizedPL(last, lots) : 0
	const unrealizedPL = baseUnreal * multiplier
	const realizedPL = (costMethod === 'FIFO' ? computeRealizedPLFIFO(lots) : computeRealizedPLAVG(lots)) * multiplier
	return { quantity: totalQuantity, avgCost: weightedAvgCost, realizedPL, unrealizedPL, todayChange }
}

export function computePortfolioMetrics(
	positions: Array<{ position: Position; lots: Lot[]; quote: { last: number | null; prevClose: number | null } }>,
	portfolio: Portfolio
) {
	let totalUnrealized = 0
	let totalRealized = 0
	let totalToday = 0
	for (const { lots, quote } of positions) {
		const m = computePositionMetrics(lots, quote, portfolio.costMethod ?? 'FIFO')
		totalUnrealized += m.unrealizedPL
		totalRealized += m.realizedPL
		totalToday += m.todayChange * m.quantity
	}
	return { totalUnrealized, totalRealized, totalToday }
}

export function applyStockSplit(lots: Lot[], ratioNumerator: number, ratioDenominator: number): Lot[] {
	const r = ratioNumerator / ratioDenominator
	return lots.map((l) => ({
		...l,
		quantity: l.side === 'buy' ? l.quantity * r : l.quantity * r,
		price: l.price / r,
	}))
}


