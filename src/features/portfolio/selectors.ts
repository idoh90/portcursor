import type { Position } from './types'

export function filterPositions(positions: Position[], query: string): Position[] {
  const q = query.trim().toLowerCase()
  if (!q) return positions
  return positions.filter(p => p.symbol.toLowerCase().includes(q) || p.displayName?.toLowerCase().includes(q))
}

export function sortPositions(positions: Position[], sort: 'symbol' | 'value' | 'pnl', valueById: Record<string, number> = {}, pnlById: Record<string, number> = {}): Position[] {
  const arr = positions.slice()
  if (sort === 'symbol') arr.sort((a,b) => a.symbol.localeCompare(b.symbol))
  else if (sort === 'value') arr.sort((a,b) => (valueById[b.id] ?? 0) - (valueById[a.id] ?? 0))
  else if (sort === 'pnl') arr.sort((a,b) => (pnlById[b.id] ?? 0) - (pnlById[a.id] ?? 0))
  return arr
}


