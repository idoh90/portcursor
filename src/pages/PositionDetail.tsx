import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { db } from '../services/db'
import { addLot, listLots, deletePosition } from '../services/repos/positionRepo'
import { formatCurrency } from '../lib/format'
import { useQuote } from '../hooks/useQuotes'
import { computePositionMetrics } from '../services/positions/plEngine'
import { useInvestmentsStore } from '../features/investments/store'

export default function PositionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [symbol, setSymbol] = useState('')
  const [position, setPosition] = useState<any>(null)
  const [lots, setLots] = useState<any[]>([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openSell, setOpenSell] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [fees, setFees] = useState('')
  const [sellQty, setSellQty] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0])
  const [sellFees, setSellFees] = useState('')
  
  const canSubmitAdd = Number(qty) !== 0 && Number(price) > 0
  const canSubmitSell = Number(sellQty) > 0 && Number(sellPrice) > 0
  // Get price data for the symbol
  const { data: quote } = useQuote(symbol)
  
  // Get investment store to refresh data after changes
  const { load: loadInvestments } = useInvestmentsStore()
  
  useEffect(() => {
    if (!id) return
    db.positions.get(id).then(p => {
      setPosition(p)
      setSymbol(p?.symbol ?? '')
    })
    listLots(id).then(res => setLots(res))
  }, [id])

  // Calculate position metrics
  const metrics = quote && lots.length > 0 ? computePositionMetrics(lots, { 
    last: quote.last, 
    prevClose: quote.prevClose 
  }, 'FIFO') : null

  const currentValue = metrics ? metrics.quantity * (quote?.last ?? quote?.prevClose ?? 0) : 0
  const add = async () => {
    if (!id || !canSubmitAdd) return
    const lot = { 
      id: `lot-${Math.random().toString(36).slice(2,8)}`, 
      positionId: id, 
      side: 'buy' as const, 
      quantity: Number(qty), 
      price: Number(price), 
      fees: Number(fees) || 0,
      date: date || new Date().toISOString()
    }
    await addLot(lot as any)
    setQty(''); setPrice(''); setFees(''); setDate(new Date().toISOString().split('T')[0]); setOpenAdd(false)
    const res = await listLots(id)
    setLots(res)
    loadInvestments() // Refresh investment store
  }

  const sell = async () => {
    if (!id || !canSubmitSell) return
    const lot = { 
      id: `lot-${Math.random().toString(36).slice(2,8)}`, 
      positionId: id, 
      side: 'sell' as const, 
      quantity: Number(sellQty), 
      price: Number(sellPrice), 
      fees: Number(sellFees) || 0,
      date: sellDate || new Date().toISOString()
    }
    await addLot(lot as any)
    setSellQty(''); setSellPrice(''); setSellFees(''); setSellDate(new Date().toISOString().split('T')[0]); setOpenSell(false)
    const res = await listLots(id)
    setLots(res)
    loadInvestments() // Refresh investment store
  }

  const handleDelete = async () => {
    if (!id) return
    await deletePosition(id)
    loadInvestments() // Refresh investment store
    navigate('/mystocks')
  }
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{symbol || `Position ${id}`}</h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>← Back</Button>
          <Button variant="danger" onClick={() => setOpenDelete(true)}>Delete Position</Button>
        </div>
      </div>

      {/* Position Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Current Value</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(currentValue)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Quantity</div>
            <div className="text-xl font-bold text-white">
              {metrics.quantity.toFixed(2)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Avg Cost</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(metrics.avgCost)}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-zinc-400 mb-1">Unrealized P&L</div>
            <div className={`text-xl font-bold ${metrics.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(metrics.unrealizedPL)}
            </div>
          </Card>
        </div>
      )}

      {/* Current Price */}
      {quote && (
        <Card className="p-4">
          <div className="text-sm text-zinc-400 mb-1">Current Price</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(quote.last ?? quote.prevClose ?? 0)}
          </div>
          {quote.prevClose && quote.last && (
            <div className={`text-sm ${(quote.last - quote.prevClose) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {quote.last > quote.prevClose ? '+' : ''}{formatCurrency(quote.last - quote.prevClose)} ({((quote.last - quote.prevClose) / quote.prevClose * 100).toFixed(2)}%)
            </div>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={() => setOpenAdd(true)} className="flex-1">Add Shares</Button>
        <Button onClick={() => setOpenSell(true)} variant="secondary" className="flex-1">Sell Shares</Button>
      </div>

      {/* Lots Table */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Transaction History</h3>
        </div>
        
        {lots.length === 0 ? (
          <EmptyState 
            title="No transactions yet" 
            body="Add your first purchase to start tracking." 
            cta={<Button size="sm" onClick={() => setOpenAdd(true)}>Add Transaction</Button>} 
          />
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-zinc-400 border-b border-zinc-700 pb-2">
              <div>Date</div>
              <div>Side</div>
              <div>Quantity</div>
              <div>Price</div>
              <div>Fees</div>
              <div>Total</div>
            </div>
            {lots.map(lot => (
              <div key={lot.id} className="grid grid-cols-6 gap-4 text-sm py-2 border-b border-zinc-800">
                <div className="text-zinc-300">{new Date(lot.date).toLocaleDateString()}</div>
                <div className={`font-medium ${lot.side === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lot.side.toUpperCase()}
                </div>
                <div className="text-white">{lot.quantity}</div>
                <div className="text-white">{formatCurrency(lot.price)}</div>
                <div className="text-zinc-400">{formatCurrency(lot.fees || 0)}</div>
                <div className="text-white">
                  {formatCurrency(lot.quantity * lot.price + (lot.fees || 0))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Lot Modal */}
      <Modal isOpen={openAdd} onClose={() => setOpenAdd(false)}>
        <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Add Shares</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Quantity</label>
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Price per Share</label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Fees (optional)</label>
              <Input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={add} disabled={!canSubmitAdd} className="flex-1">Add</Button>
            <Button variant="ghost" onClick={() => setOpenAdd(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Sell Lot Modal */}
      <Modal isOpen={openSell} onClose={() => setOpenSell(false)}>
        <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Sell Shares</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Quantity to Sell</label>
              <Input type="number" value={sellQty} onChange={(e) => setSellQty(e.target.value)} placeholder="50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Sale Price per Share</label>
              <Input type="number" step="0.01" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="160.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Fees (optional)</label>
              <Input type="number" step="0.01" value={sellFees} onChange={(e) => setSellFees(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Sale Date</label>
              <Input type="date" value={sellDate} onChange={(e) => setSellDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={sell} disabled={!canSubmitSell} className="flex-1">Record Sale</Button>
            <Button variant="ghost" onClick={() => setOpenSell(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={openDelete} onClose={() => setOpenDelete(false)}>
        <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Delete Position</h2>
          <p className="text-zinc-300 mb-6">
            Are you sure you want to delete this position? This will permanently remove all transaction history for {symbol}. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={handleDelete} className="flex-1">Delete</Button>
            <Button variant="ghost" onClick={() => setOpenDelete(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


