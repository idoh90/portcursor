import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { etfSchema, type EtfFormData } from '../../../schemas/investments/etf'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface EtfFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EtfFormData) => Promise<void>
  editingData?: EtfFormData
}

export default function EtfForm({ isOpen, onClose, onSubmit, editingData }: EtfFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<EtfFormData>({
    resolver: zodResolver(etfSchema),
    defaultValues: editingData || {
      side: 'long',
      entryMode: 'lots',
      visibility: 'public',
      lots: [{ date: new Date().toISOString().split('T')[0], shares: 0, price: 0 }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lots'
  })

  const entryMode = watch('entryMode')
  const lots = watch('lots')
  const average = watch('average')
  const side = watch('side')

  // Calculate derived values (same logic as stock)
  const derivedValues = (() => {
    if (entryMode === 'lots' && lots && lots.length > 0) {
      const totalShares = lots.reduce((sum, lot) => sum + (lot.shares || 0), 0)
      const totalCost = lots.reduce((sum, lot) => sum + ((lot.shares || 0) * (lot.price || 0) + (lot.fees || 0)), 0)
      const avgCost = totalShares > 0 ? totalCost / totalShares : 0
      
      return {
        totalShares,
        totalCost,
        avgCost,
        costBasis: totalCost
      }
    } else if (entryMode === 'average' && average) {
      const totalCost = (average.totalShares || 0) * (average.avgPrice || 0) + (average.totalFees || 0)
      
      return {
        totalShares: average.totalShares || 0,
        totalCost,
        avgCost: average.avgPrice || 0,
        costBasis: totalCost
      }
    }
    
    return { totalShares: 0, totalCost: 0, avgCost: 0, costBasis: 0 }
  })()

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: EtfFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit ETF form:', error)
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

  const addLot = () => {
    append({ date: new Date().toISOString().split('T')[0], shares: 0, price: 0 })
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">ETF Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                ETF Ticker *
              </label>
              <Input
                {...register('ticker')}
                placeholder="VOO"
                className="uppercase"
                maxLength={10}
              />
              {errors.ticker && (
                <p className="text-red-400 text-sm mt-1">{errors.ticker.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                ETF Type (Optional)
              </label>
              <select
                {...register('etfType')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select type...</option>
                <option value="equity">Equity ETF</option>
                <option value="bond">Bond ETF</option>
                <option value="commodity">Commodity ETF</option>
                <option value="mixed">Mixed/Multi-Asset ETF</option>
              </select>
              {errors.etfType && (
                <p className="text-red-400 text-sm mt-1">{errors.etfType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Expense Ratio % (Optional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="0.03"
                {...register('expenseRatio', { valueAsNumber: true })}
              />
              <p className="text-xs text-zinc-400 mt-1">Annual expense ratio as percentage</p>
              {errors.expenseRatio && (
                <p className="text-red-400 text-sm mt-1">{errors.expenseRatio.message}</p>
              )}
            </div>
          </div>
        )

      case 2: // Exposure (same as stock)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Position Exposure</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Position Side *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'long', label: 'Long', desc: 'Betting ETF goes up' },
                  { value: 'short', label: 'Short', desc: 'Betting ETF goes down' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('side', option.value as 'long' | 'short')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      side === option.value
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
                Entry Mode *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'lots', label: 'Individual Lots', desc: 'Track each purchase separately' },
                  { value: 'average', label: 'Average Cost', desc: 'Simple average entry' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('entryMode', option.value as 'lots' | 'average')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      entryMode === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
              {errors.entryMode && (
                <p className="text-red-400 text-sm mt-1">{errors.entryMode.message}</p>
              )}
            </div>
          </div>
        )

      case 3: // Cost/Lots (same as stock)
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cost & Purchase Details</h3>
            
            {entryMode === 'lots' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Individual Lots</span>
                  <Button type="button" size="sm" onClick={addLot}>
                    Add Lot
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-300">Lot {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Date</label>
                        <Input
                          type="date"
                          {...register(`lots.${index}.date`)}
                        />
                        {errors.lots?.[index]?.date && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.date?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Shares</label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`lots.${index}.shares`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.shares && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.shares?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Price</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`lots.${index}.price`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.price && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.price?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Fees (Optional)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`lots.${index}.fees`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.fees && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.fees?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Average Cost Entry</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Average Price *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="400.00"
                      {...register('average.avgPrice', { valueAsNumber: true })}
                    />
                    {errors.average?.avgPrice && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.avgPrice.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Shares *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="100"
                      {...register('average.totalShares', { valueAsNumber: true })}
                    />
                    {errors.average?.totalShares && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.totalShares.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Fees (Optional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('average.totalFees', { valueAsNumber: true })}
                    />
                    {errors.average?.totalFees && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.totalFees.message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Derived Values Display */}
            {derivedValues.totalShares > 0 && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Total Shares:</span>
                    <span className="text-white ml-2">{derivedValues.totalShares.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Avg Cost:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.avgCost)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cost Basis:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.costBasis)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 4: // Distribution & Targets
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Distributions & Targets</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Distribution Settings</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('distribution.drip')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Enable DRIP (Distribution Reinvestment)</span>
                </label>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Distribution Frequency (Optional)</label>
                  <select
                    {...register('distribution.frequency')}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select frequency...</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                    <option value="irregular">Irregular</option>
                  </select>
                  {errors.distribution?.frequency && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.distribution.frequency.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Price Targets & Alerts</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Take Profit Price (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="450.00"
                    {...register('targets.takeProfit', { valueAsNumber: true })}
                  />
                  {errors.targets?.takeProfit && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.takeProfit.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Stop Loss Price (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="350.00"
                    {...register('targets.stopLoss', { valueAsNumber: true })}
                  />
                  {errors.targets?.stopLoss && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.stopLoss.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this ETF position..."
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
                    { value: 'public', label: 'Public', desc: 'Anyone can see this ETF position' },
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
              <h4 className="text-sm font-medium text-zinc-300 mb-3">ETF Position Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">ETF:</span>
                  <span className="text-white">{watch('ticker')} ({side?.toUpperCase()})</span>
                </div>
                {watch('etfType') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Type:</span>
                    <span className="text-white">{watch('etfType')}</span>
                  </div>
                )}
                {watch('expenseRatio') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Expense Ratio:</span>
                    <span className="text-white">{watch('expenseRatio')}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Shares:</span>
                  <span className="text-white">{derivedValues.totalShares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Average Cost:</span>
                  <span className="text-white">{formatCurrency(derivedValues.avgCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Investment:</span>
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
              {editingData ? 'Edit ETF Position' : 'Add ETF Position'}
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
                  {editingData ? 'Update ETF Position' : 'Add ETF Position'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
