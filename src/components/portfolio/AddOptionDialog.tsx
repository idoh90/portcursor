import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useState, useEffect } from 'react'

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (payload: { side: 'CALL' | 'PUT'; underlying: string; strike: number; expiration: string; quantity: number; premium: number }) => Promise<void> | void }

export default function AddOptionDialog({ open, onOpenChange, onSubmit }: Props) {
  const [side, setSide] = useState<'CALL' | 'PUT'>('CALL')
  const [underlying, setUnderlying] = useState('')
  const [strike, setStrike] = useState('')
  const [expiration, setExpiration] = useState('')
  const [qty, setQty] = useState('')
  const [prem, setPrem] = useState('')
  const canSubmit = underlying && Number(strike) > 0 && expiration && Number(qty) > 0 && Number(prem) > 0
  useEffect(() => { if (!open) { setUnderlying(''); setStrike(''); setExpiration(''); setQty(''); setPrem(''); setSide('CALL') } }, [open])
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title="Add option position">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label>Side</label>
        <select className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-1 text-sm" value={side} onChange={(e) => setSide(e.target.value as any)}>
          <option value="CALL">CALL</option>
          <option value="PUT">PUT</option>
        </select>
        <label>Underlying</label>
        <Input value={underlying} onChange={(e) => setUnderlying(e.target.value.toUpperCase())} />
        <label>Strike</label>
        <Input type="number" value={strike} onChange={(e) => setStrike(e.target.value)} />
        <label>Expiration</label>
        <Input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} />
        <label>Quantity</label>
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <label>Avg premium</label>
        <Input type="number" value={prem} onChange={(e) => setPrem(e.target.value)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button disabled={!canSubmit} onClick={async () => { await onSubmit({ side, underlying, strike: Number(strike), expiration, quantity: Number(qty), premium: Number(prem) }); onOpenChange(false) }}>Add</Button>
      </div>
    </Modal>
  )
}


