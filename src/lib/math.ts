import type { Position } from '../features/portfolio/types';

function sum(numbers: number[]): number { return numbers.reduce((a, b) => a + b, 0); }

export function quantityOpen(position: Position): number {
  return sum(position.lots.map(l => l.quantity));
}

export function avgCost(position: Position): { avg: number; totalCost: number } {
  const openQty = quantityOpen(position);
  if (openQty === 0) return { avg: 0, totalCost: 0 };
  // Weighted average of open lots only (buys positive, sells negative)
  const weighted = sum(position.lots.map(l => l.quantity * l.price));
  const avg = weighted / openQty;
  return { avg, totalCost: avg * openQty };
}

export function marketValue(position: Position, livePrice: number): number {
  const qty = quantityOpen(position);
  return qty * (Number.isFinite(livePrice) ? livePrice : 0);
}

export function realizedPnLFromClosedLots(position: Position): number {
  // Very basic: any negative-quantity lot considered a close at given lot price vs avg of preceding buys
  let runningBuysQty = 0;
  let runningBuysCost = 0;
  let realized = 0;
  const lotsByDate = [...position.lots].sort((a, b) => a.date.localeCompare(b.date));
  for (const lot of lotsByDate) {
    if (lot.quantity > 0) {
      runningBuysQty += lot.quantity;
      runningBuysCost += lot.quantity * lot.price;
    } else if (lot.quantity < 0) {
      const closeQty = Math.min(runningBuysQty, Math.abs(lot.quantity));
      const avg = runningBuysQty === 0 ? 0 : runningBuysCost / runningBuysQty;
      realized += (lot.price - avg) * closeQty;
      runningBuysQty -= closeQty;
      runningBuysCost -= avg * closeQty;
    }
  }
  return realized;
}

export function unrealizedPnL(position: Position, livePrice: number): { abs: number; pct: number } {
  const { avg } = avgCost(position);
  const qty = quantityOpen(position);
  if (qty === 0) return { abs: 0, pct: 0 };
  // const abs = (Number.isFinite(livePrice) ? livePrice : 0 - avg) * qty + (avg * qty - avg * qty);
  const mv = qty * (Number.isFinite(livePrice) ? livePrice : 0);
  const cost = avg * qty;
  const pct = cost === 0 ? 0 : ((mv - cost) / cost) * 100;
  return { abs: mv - cost, pct };
}


