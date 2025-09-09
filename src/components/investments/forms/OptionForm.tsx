import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  optionSchema, 
  type OptionFormData,
  calculateDaysToExpiry,
  calculateBreakeven,
  calculateNotionalValue,
  calculateCostBasis
} from '../../../schemas/investments/option'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface OptionFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: OptionFormData) => Promise<void>
  editingData?: OptionFormData
}

export default function OptionForm({ isOpen, onClose, onSubmit, editingData }: OptionFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: editingData || {
      kind: 'call',
      style: 'american',
      multiplier: 100,
      side: 'long',
      contracts: 1,
      premium: 0,
      entryDate: new Date().toISOString().split('T')[0],
      visibility: 'public'
    }
  })

  const watchedValues = watch()

  // Calculate derived values
  const derivedValues = useMemo(() => {
    const expiration = watchedValues.expiration
    const strike = watchedValues.strike || 0
    const premium = watchedValues.premium || 0
    const contracts = watchedValues.contracts || 0
    const multiplier = watchedValues.multiplier || 100
    const fees = watchedValues.fees || 0
    const kind = watchedValues.kind

    let daysToExpiry = 0
    let breakeven = 0
    if (expiration && strike && premium) {
      daysToExpiry = calculateDaysToExpiry(expiration)
      breakeven = calculateBreakeven(kind, strike, premium)
    }

    const costBasis = calculateCostBasis(contracts, multiplier, premium, fees)
    // Note: notional value would need underlying price from API
    const notional = 0 // calculateNotionalValue(contracts, multiplier, underlyingPrice)

    return {
      daysToExpiry,
      breakeven,
      costBasis,
      notional
    }
  }, [watchedValues])

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: OptionFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit option form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 5) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Contract Details
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Option Contract</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Underlying Ticker *
              </label>
              <Input
                {...register('underlying')}
                placeholder="AAPL"
                className="uppercase"
                maxLength={10}
              />
              {errors.underlying && (
                <p className="text-red-400 text-sm mt-1">{errors.underlying.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Option Type *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'call', label: 'Call', desc: 'Right to buy at strike' },
                  { value: 'put', label: 'Put', desc: 'Right to sell at strike' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('kind', option.value as 'call' | 'put')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.kind === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
              {errors.kind && (
                <p className="text-red-400 text-sm mt-1">{errors.kind.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Expiration Date *
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('expiration')}
                />
                {errors.expiration && (
                  <p className="text-red-400 text-sm mt-1">{errors.expiration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Strike Price *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="150.00"
                  {...register('strike', { valueAsNumber: true })}
                />
                {errors.strike && (
                  <p className="text-red-400 text-sm mt-1">{errors.strike.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Style (Optional)
                </label>
                <select
                  {...register('style')}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="american">American</option>
                  <option value="european">European</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Contract Multiplier
                </label>
                <Input
                  type="number"
                  {...register('multiplier', { valueAsNumber: true })}
                  placeholder="100"
                />
                <p className="text-xs text-zinc-400 mt-1">Usually 100 for equity options</p>
                {errors.multiplier && (
                  <p className="text-red-400 text-sm mt-1">{errors.multiplier.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 2: // Exposure
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Position Exposure</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Position Side *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'long', label: 'Long (Buy)', desc: 'You pay premium' },
                  { value: 'short', label: 'Short (Sell)', desc: 'You receive premium' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('side', option.value as 'long' | 'short')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.side === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
              {errors.side && (
                <p className="text-red-400 text-sm mt-1">{errors.side.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Number of Contracts *
              </label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="1"
                {...register('contracts', { valueAsNumber: true })}
              />
              {errors.contracts && (
                <p className="text-red-400 text-sm mt-1">{errors.contracts.message}</p>
              )}
            </div>
          </div>
        )

      case 3: // Cost/Premium
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cost & Premium</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Premium per Contract *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5.50"
                  {...register('premium', { valueAsNumber: true })}
                />
                <p className="text-xs text-zinc-400 mt-1">Price paid/received per contract</p>
                {errors.premium && (
                  <p className="text-red-400 text-sm mt-1">{errors.premium.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Fees (Optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="1.00"
                  {...register('fees', { valueAsNumber: true })}
                />
                {errors.fees && (
                  <p className="text-red-400 text-sm mt-1">{errors.fees.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Entry Date *
              </label>
              <Input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                {...register('entryDate')}
              />
              {errors.entryDate && (
                <p className="text-red-400 text-sm mt-1">{errors.entryDate.message}</p>
              )}
            </div>

            {/* Derived Values Display */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-2">Contract Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {derivedValues.daysToExpiry > 0 && (
                  <div>
                    <span className="text-zinc-400">Days to Expiry:</span>
                    <span className="text-white ml-2">{derivedValues.daysToExpiry}</span>
                  </div>
                )}
                {derivedValues.breakeven > 0 && (
                  <div>
                    <span className="text-zinc-400">Breakeven:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.breakeven)}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-400">Cost Basis:</span>
                  <span className="text-white ml-2">{formatCurrency(derivedValues.costBasis)}</span>
                </div>
              </div>
            </Card>
          </div>
        )

      case 4: // Advanced & Targets
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Advanced & Targets</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Greeks (Optional, for reference)</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Delta</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="-1"
                    max="1"
                    placeholder="0.50"
                    {...register('greeks.delta', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Gamma</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.05"
                    {...register('greeks.gamma', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Theta</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="-0.10"
                    {...register('greeks.theta', { valueAsNumber: true })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Implied Volatility %</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1000"
                    placeholder="25.0"
                    {...register('greeks.impliedVolatility', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Targets & Risk Management</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Target Premium (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="8.00"
                    {...register('targets.targetPremium', { valueAsNumber: true })}
                  />
                  {errors.targets?.targetPremium && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.targetPremium.message}
                    </p>
                  )}
                </div>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('targets.maxLossGuard')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Enable maximum loss protection</span>
                </label>
                
                {watchedValues.targets?.maxLossGuard && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Collateral Amount</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="15000.00"
                      {...register('targets.collateral', { valueAsNumber: true })}
                    />
                    <p className="text-xs text-zinc-400 mt-1">Cash secured or collateral amount</p>
                    {errors.targets?.collateral && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.targets.collateral.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this option position..."
              />
            </div>
          </div>
        )

      case 5: // Privacy & Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Privacy & Review</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this option position' },
                    { value: 'friends', label: 'Friends Only', desc: 'Only your friends can see this' },
                    { value: 'private', label: 'Private', desc: 'Only you can see this position' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('visibility')}
                        className="text-blue-500"
                      />
                      <div>
                        <div className="text-sm text-white">{option.label}</div>
                        <div className="text-xs text-zinc-400">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.visibility && (
                  <p className="text-red-400 text-sm mt-1">{errors.visibility.message}</p>
                )}
              </div>
            </Card>

            {/* Final Review */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Option Contract Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Contract:</span>
                  <span className="text-white">
                    {watchedValues.underlying} {watchedValues.expiration && new Date(watchedValues.expiration).toLocaleDateString()} 
                    {' '}{formatCurrency(watchedValues.strike || 0)} {watchedValues.kind?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Position:</span>
                  <span className="text-white">
                    {watchedValues.side?.toUpperCase()} {watchedValues.contracts} contracts
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Premium:</span>
                  <span className="text-white">{formatCurrency(watchedValues.premium || 0)} per contract</span>
                </div>
                {derivedValues.daysToExpiry > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Days to Expiry:</span>
                    <span className="text-white">{derivedValues.daysToExpiry}</span>
                  </div>
                )}
                {derivedValues.breakeven > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Breakeven:</span>
                    <span className="text-white">{formatCurrency(derivedValues.breakeven)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Cost:</span>
                  <span className="text-white font-medium">{formatCurrency(derivedValues.costBasis)}</span>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">
              {editingData ? 'Edit Option Position' : 'Add Option Position'}
            </h2>
            <div className="text-sm text-zinc-400">
              Step {step} of 5
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-zinc-400">✕</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-zinc-800/50">
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < step ? 'bg-blue-500 text-white' :
                  i === step ? 'bg-blue-500/20 text-blue-300 border-2 border-blue-500' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {i}
                </div>
                {i < 5 && (
                  <div className={`w-8 h-1 mx-2 rounded ${
                    i < step ? 'bg-blue-500' : 'bg-zinc-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-zinc-700 bg-zinc-800/50">
            <Button
              type="button"
              variant="ghost"
              onClick={prevStep}
              disabled={step === 1}
            >
              ← Back
            </Button>

            <div className="flex items-center gap-3">
              {step < 5 ? (
                <Button type="button" onClick={nextStep}>
                  Next →
                </Button>
              ) : (
                <Button type="submit" isLoading={isSubmitting}>
                  {editingData ? 'Update Option Position' : 'Add Option Position'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
