import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { db } from '../services/db'
import { addLot, listLots } from '../services/repos/positionRepo'

export default function PositionDetail() {
  const { id } = useParams()
  const [symbol, setSymbol] = useState('')
  const [lots, setLots] = useState<any[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const canSubmit = Number(qty) !== 0 && Number(price) > 0
  useEffect(() => {
    if (!id) return
    db.positions.get(id).then(p => setSymbol(p?.symbol ?? ''))
    listLots(id).then(res => setLots(res))
  }, [id])
  const add = async () => {
    if (!id || !canSubmit) return
    const l = { id: `lot-${Math.random().toString(36).slice(2,8)}`, positionId: id, side: Number(qty) >= 0 ? 'buy' : 'sell', quantity: Math.abs(Number(qty)), price: Number(price), date: new Date().toISOString() }
    await addLot(l as any)
    setQty(''); setPrice(''); setOpenAdd(false)
    const res = await listLots(id)
    setLots(res)
  }
  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-xl font-semibold">{symbol || `Position ${id}`}</h1>
      <Card head="Lots">
        {lots.length === 0 ? (
          <EmptyState title="No lots yet" body="Add your first lot to start tracking." cta={<Button size="sm" onClick={() => setOpenAdd(true)}>Add lot</Button>} />
        ) : (
          <div className="space-y-2">
            {lots.map(l => (
              <div key={l.id} className="grid grid-cols-4 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-sm">
                <div>{new Date(l.date).toLocaleDateString()}</div>
                <div className="text-zinc-400">{l.side}</div>
                <div>Qty: {l.quantity}</div>
                <div>Px: {l.price}</div>
              </div>
            ))}
            <div className="pt-2">
              <Button size="sm" variant="secondary" onClick={() => setOpenAdd(true)}>Add lot</Button>
            </div>
          </div>
        )}
      </Card>
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Add lot">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <label>Quantity</label>
          <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
          <label>Price</label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={add} disabled={!canSubmit}>Add</Button>
        </div>
      </Modal>
    </div>
  )
}


