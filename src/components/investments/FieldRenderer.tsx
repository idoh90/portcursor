import Input from '../ui/Input'
import type { InvestmentType } from '../../features/investments/types'

interface FieldRendererProps {
  investmentType: InvestmentType
  formData: Record<string, any>
  onChange: (field: string, value: any) => void
  errors: Record<string, string>
  step?: 'basic' | 'details' | 'lots'
}

export default function FieldRenderer({ 
  investmentType, 
  formData, 
  onChange, 
  errors, 
  step = 'basic' 
}: FieldRendererProps) {
  if (step === 'basic') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Symbol</label>
          <Input
            placeholder="e.g. AAPL"
            value={formData.symbol || ''}
            onChange={(e) => onChange('symbol', e.target.value)}
          />
          {errors.symbol && <p className="text-xs text-red-400">{errors.symbol}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Display Name</label>
          <Input
            placeholder="e.g. Apple Inc."
            value={formData.displayName || ''}
            onChange={(e) => onChange('displayName', e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-300">Account</label>
          <Input
            placeholder="e.g. Brokerage Account"
            value={formData.account || ''}
            onChange={(e) => onChange('account', e.target.value)}
          />
        </div>
      </div>
    )
  }
  
  if (step === 'lots') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Quantity</label>
            <Input
              type="number"
              placeholder="100"
              value={formData.quantity || ''}
              onChange={(e) => onChange('quantity', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Price</label>
            <Input
              type="number"
              step="0.01"
              placeholder="150.00"
              value={formData.price || ''}
              onChange={(e) => onChange('price', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Fees</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.fees || ''}
              onChange={(e) => onChange('fees', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Date</label>
            <Input
              type="date"
              value={formData.date || ''}
              onChange={(e) => onChange('date', e.target.value)}
            />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="text-zinc-400 text-center py-8">
      Form fields for {investmentType} will be implemented here
    </div>
  )
}