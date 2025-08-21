import Big from 'big.js'
import type { Lot } from '../../models/types'

export type AvgCostResult = {
	totalQuantity: number
	weightedAvgCost: number
}

export function computeWeightedAverageCost(lots: Lot[]): AvgCostResult {
	let qty = new Big(0)
	let cost = new Big(0)
	for (const l of lots) {
		if (l.side === 'buy') {
			qty = qty.plus(l.quantity)
			cost = cost.plus(new Big(l.quantity).times(l.price).plus(l.fees ?? 0))
		} else {
			qty = qty.minus(l.quantity)
		}
	}
	const totalQuantity = Number(qty)
	const weightedAvgCost = totalQuantity > 0 ? Number(cost.div(qty)) : 0
	return { totalQuantity, weightedAvgCost }
}

export function computeRealizedPLFIFO(lots: Lot[]): number {
	// FIFO sell realization
	const buys: { qty: Big; price: Big }[] = []
	let realized = new Big(0)
	for (const l of lots) {
		if (l.side === 'buy') {
			buys.push({ qty: new Big(l.quantity), price: new Big(l.price) })
			continue
		}
		let sellQty = new Big(l.quantity)
		while (sellQty.gt(0) && buys.length) {
			const b = buys[0]
			const used = b.qty.lt(sellQty) ? b.qty : sellQty
			realized = realized.plus(used.times(new Big(l.price).minus(b.price)))
			b.qty = b.qty.minus(used)
			sellQty = sellQty.minus(used)
			if (b.qty.lte(0)) buys.shift()
		}
	}
	return Number(realized)
}

export function computeUnrealizedPL(currentPrice: number, lots: Lot[]): number {
	const { totalQuantity, weightedAvgCost } = computeWeightedAverageCost(lots)
	if (totalQuantity <= 0) return 0
	return Number(new Big(totalQuantity).times(new Big(currentPrice).minus(weightedAvgCost)))
}


