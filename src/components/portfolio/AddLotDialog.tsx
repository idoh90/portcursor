import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useState, useEffect } from 'react'

interface Props { open: boolean; onOpenChange: (v: boolean) => void; onSubmit: (qty: number, price: number) => Promise<void> | void }

export default function AddLotDialog({ open, onOpenChange, onSubmit }: Props) {
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const canSubmit = Number(qty) !== 0 && Number(price) > 0
  useEffect(() => { if (!open) { setQty(''); setPrice('') } }, [open])
  return (
    <Modal open={open} onClose={() => onOpenChange(false)} title="Add lot">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <label>Quantity</label>
        <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
        <label>Price</label>
        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button disabled={!canSubmit} onClick={async () => { await onSubmit(Number(qty), Number(price)); onOpenChange(false) }}>Add</Button>
      </div>
    </Modal>
  )
}


