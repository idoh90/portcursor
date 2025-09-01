interface LotRowProps {
  id: string
  date: string
  side: 'buy' | 'sell'
  quantity: number
  price: number
  onEdit?: (id: string) => void
  onRemove?: (id: string) => void
}

export default function LotRow({ id, date, side, quantity, price, onEdit, onRemove }: LotRowProps) {
  return (
    <div className="grid grid-cols-6 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-2 py-2 text-sm">
      <div className="col-span-2">{new Date(date).toLocaleDateString()}</div>
      <div className="capitalize text-zinc-400">{side}</div>
      <div>Qty: {quantity}</div>
      <div>Px: {price}</div>
      <div className="flex justify-end gap-2">
        {onEdit ? <button className="text-xs text-indigo-400" onClick={() => onEdit(id)}>Edit</button> : null}
        {onRemove ? <button className="text-xs text-red-400" onClick={() => onRemove(id)}>Remove</button> : null}
      </div>
    </div>
  )
}


