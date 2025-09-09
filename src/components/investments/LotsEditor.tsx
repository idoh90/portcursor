import { useState } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import { formatCurrency } from '../../lib/format'
import type { Lot } from '../../features/investments/types'

interface LotsEditorProps {
  lots: Lot[]
  onChange: (lots: Lot[]) => void
  currentPrice?: number
  prevClose?: number
  symbol?: string
  investmentType?: string
  readonly?: boolean
}

export default function LotsEditor({ 
  lots, 
  onChange, 
  currentPrice = 0, 
  readonly = false 
}: LotsEditorProps) {
  const [isAddingLot, setIsAddingLot] = useState(false)
  const [formData, setFormData] = useState({
    quantity: '',
    price: '',
    fees: '0',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleAddLot = () => {
    const newLot: Lot = {
      id: crypto.randomUUID(),
      quantity: parseFloat(formData.quantity),
      price: parseFloat(formData.price),
      fees: parseFloat(formData.fees) || 0,
      date: formData.date,
      notes: formData.notes || undefined,
    }

    onChange([...lots, newLot])
    setFormData({
      quantity: '',
      price: '',
      fees: '0',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setIsAddingLot(false)
  }

  const handleDeleteLot = (lotId: string) => {
    if (window.confirm('Are you sure you want to delete this lot?')) {
      onChange(lots.filter(lot => lot.id !== lotId))
    }
  }

  // Calculate totals
  const totalQuantity = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const totalCost = lots.reduce((sum, lot) => sum + (lot.quantity * lot.price + (lot.fees || 0)), 0)
  const avgCost = totalQuantity > 0 ? totalCost / totalQuantity : 0
  const currentValue = totalQuantity * currentPrice

  return (
    <div className="space-y-6">
      {/* Position Summary */}
      {lots.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-white mb-4">Position Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Total Shares</div>
              <div className="text-lg font-semibold text-white">
                {totalQuantity.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Avg Cost</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(avgCost)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Total Cost</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(totalCost)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Current Value</div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(currentValue)}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Lots Table */}
      <Card>
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">Lots ({lots.length})</h3>
            {!readonly && (
              <Button
                onClick={() => setIsAddingLot(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                ➕ Add Lot
              </Button>
            )}
          </div>
        </div>

        {lots.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <div className="mb-2">No lots added yet</div>
            {!readonly && (
              <Button onClick={() => setIsAddingLot(true)} size="sm">
                Add Your First Lot
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {lots.map((lot) => (
              <div key={lot.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-zinc-300">{new Date(lot.date).toLocaleDateString()}</div>
                  <div className="text-sm text-white font-medium">{lot.quantity} shares</div>
                  <div className="text-sm text-white">@ {formatCurrency(lot.price)}</div>
                  {lot.fees && <div className="text-sm text-zinc-400">Fees: {formatCurrency(lot.fees)}</div>}
                </div>
                {!readonly && (
                  <button
                    onClick={() => handleDeleteLot(lot.id)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Lot Form */}
      {isAddingLot && (
        <Card className="p-4 border-blue-500/50">
          <h4 className="font-medium text-white mb-4">Add New Lot</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Quantity *</label>
              <Input
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Price per Share *</label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="150.00"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Fees</label>
              <Input
                type="number"
                step="0.01"
                value={formData.fees}
                onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleAddLot}>Add Lot</Button>
            <Button variant="ghost" onClick={() => setIsAddingLot(false)}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  )
}