import { useEffect, useState } from 'react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'
import { listPortfoliosByUser, createPortfolio } from '../../services/repos/portfolioRepo'
import { createPosition } from '../../services/repos/positionRepo'
import { db } from '../../services/db'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (positionId: string) => void
  initialSymbol?: string
}

export default function AddPositionDrawer({ open, onOpenChange, onCreated, initialSymbol }: Props) {
  const [symbol, setSymbol] = useState('')
  const [qty, setQty] = useState('')
  const [avg, setAvg] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const canSubmit = symbol.trim().length >= 1 && Number(qty) > 0 && Number(avg) > 0

  useEffect(() => { if (!open) { setSymbol(''); setQty(''); setAvg(''); setNote('') } else if (initialSymbol) { setSymbol(initialSymbol) } }, [open, initialSymbol])

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    const now = new Date().toISOString()
    // Get or create a portfolio (first user or anonymous)
    let portfolioId: string | undefined
    const anyPortfolio = await db.portfolios.toCollection().first()
    if (!anyPortfolio) {
      const pfId = `pf-${Math.random().toString(36).slice(2, 8)}`
      await createPortfolio({ id: pfId, userId: 'u-ido', name: 'Main', currency: 'USD', visibility: 'public', pinnedSymbols: [], createdAt: now, updatedAt: now })
      portfolioId = pfId
    } else {
      portfolioId = anyPortfolio.id
    }
    const posId = `pos-${symbol.toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`
    await createPosition({ id: posId, portfolioId: portfolioId!, symbol: symbol.toUpperCase(), type: 'stock', status: 'open', createdAt: now, updatedAt: now })
    // Initial buy lot
    await db.lots.put({ id: `lot-${Math.random().toString(36).slice(2, 8)}`, positionId: posId, side: 'buy', quantity: Number(qty), price: Number(avg), date: now })
    setSaving(false)
    onOpenChange(false)
    onCreated?.(posId)
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="text-base font-semibold">Add position</div>
        <Card className="mt-3 space-y-3">
          <div className="grid grid-cols-3 items-center gap-2 text-sm">
            <label className="col-span-1">Symbol</label>
            <Input className="col-span-2" placeholder="AAPL" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
            <label>Quantity</label>
            <Input type="number" min={0} step="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            <label>Avg price</label>
            <Input type="number" min={0} step="0.01" value={avg} onChange={(e) => setAvg(e.target.value)} />
            <label>Notes</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={!canSubmit || saving}>{saving ? 'Adding…' : 'Add'}</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}


