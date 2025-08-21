import type { Dividend, Lot } from '../../models/types'
import { computeWeightedAverageCost } from '../repos/plHelpers'

export function computeTrailing12MDividendPerShare(dividends: Dividend[], asOfIso: string): number {
	const asOf = new Date(asOfIso).getTime()
	const oneYearMs = 365 * 24 * 60 * 60 * 1000
	return dividends
		.filter((d) => new Date(d.payDate ?? d.exDate).getTime() >= asOf - oneYearMs)
		.reduce((sum, d) => sum + d.amountPerShare, 0)
}

export function computeDividendYieldPercent(dividends: Dividend[], asOfIso: string, currentPrice: number): number {
	if (!currentPrice || Number.isNaN(currentPrice) || currentPrice <= 0) return 0
	const ttm = computeTrailing12MDividendPerShare(dividends, asOfIso)
	return (ttm / currentPrice) * 100
}

// For option expiration/assignment helpers, we assume caller resolves long/short semantics.
// If long and expires worthless: realized P/L equals negative of remaining cost basis.
// If short and expires worthless: realized P/L equals remaining premium kept.
export function computeOptionExpirationPL(lots: Lot[], positionIsLong: boolean): number {
	const { totalQuantity, weightedAvgCost } = computeWeightedAverageCost(lots)
	if (totalQuantity === 0) return 0
	if (positionIsLong) {
		// Remaining quantity loses its cost (option goes to 0)
		return -totalQuantity * weightedAvgCost
	} else {
		// Remaining short quantity keeps the premium
		return totalQuantity * weightedAvgCost
	}
}


