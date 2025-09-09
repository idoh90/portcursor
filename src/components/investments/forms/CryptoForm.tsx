import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  cryptoSchema, 
  type CryptoFormData,
  calculateCostBasisUSD,
  calculateAverageCostUSD,
  calculateTotalAmount
} from '../../../schemas/investments/crypto'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface CryptoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CryptoFormData) => Promise<void>
  editingData?: CryptoFormData
}

export default function CryptoForm({ isOpen, onClose, onSubmit, editingData }: CryptoFormProps) {
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
  } = useForm<CryptoFormData>({
    resolver: zodResolver(cryptoSchema),
    defaultValues: editingData || {
      side: 'long',
      entryMode: 'lots',
      visibility: 'public',
      lots: [{ date: new Date().toISOString().split('T')[0], amount: 0, priceUSD: 0 }]
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

  // Calculate derived values
  const derivedValues = useMemo(() => {
    const totalAmount = calculateTotalAmount(entryMode, lots, average)
    const avgCostUSD = calculateAverageCostUSD(entryMode, lots, average)
    const costBasisUSD = calculateCostBasisUSD(entryMode, lots, average)

    return {
      totalAmount,
      avgCostUSD,
      costBasisUSD
    }
  }, [entryMode, lots, average])

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: CryptoFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit crypto form:', error)
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
    append({ date: new Date().toISOString().split('T')[0], amount: 0, priceUSD: 0 })
  }

  // Helper to paste transaction data from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      // Simple CSV parsing for transactions: date,amount,price,fees
      const lines = text.trim().split('\n')
      const newLots = lines.map(line => {
        const [date, amount, priceUSD, feesUSD] = line.split(',')
        return {
          date: date?.trim() || new Date().toISOString().split('T')[0],
          amount: parseFloat(amount?.trim()) || 0,
          priceUSD: parseFloat(priceUSD?.trim()) || 0,
          feesUSD: parseFloat(feesUSD?.trim()) || 0
        }
      }).filter(lot => lot.amount > 0 && lot.priceUSD > 0)

      if (newLots.length > 0) {
        // Replace current lots with pasted data
        setValue('lots', newLots)
      }
    } catch (error) {
      console.warn('Failed to paste from clipboard:', error)
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cryptocurrency Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Asset Symbol *
              </label>
              <Input
                {...register('asset')}
                placeholder="BTC"
                className="uppercase"
                maxLength={10}
              />
              <p className="text-xs text-zinc-400 mt-1">e.g., BTC, ETH, ADA, SOL</p>
              {errors.asset && (
                <p className="text-red-400 text-sm mt-1">{errors.asset.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Network (Optional)
              </label>
              <Input
                {...register('network')}
                placeholder="Ethereum"
              />
              <p className="text-xs text-zinc-400 mt-1">e.g., Ethereum, Solana, Polygon</p>
              {errors.network && (
                <p className="text-red-400 text-sm mt-1">{errors.network.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Custody (Optional)
                </label>
                <select
                  {...register('custody')}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select custody...</option>
                  <option value="exchange">Exchange</option>
                  <option value="wallet">Personal Wallet</option>
                </select>
                {errors.custody && (
                  <p className="text-red-400 text-sm mt-1">{errors.custody.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Label (Optional)
                </label>
                <Input
                  {...register('label')}
                  placeholder="Binance Main"
                />
                <p className="text-xs text-zinc-400 mt-1">e.g., exchange name, wallet type</p>
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
                  { value: 'long', label: 'Long (Hold)', desc: 'Own the cryptocurrency' },
                  { value: 'short', label: 'Short', desc: 'Betting price goes down' }
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
                  { value: 'lots', label: 'Transaction Lots', desc: 'Track each purchase/trade separately' },
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

      case 3: // Cost/Lots
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Cost & Transaction Details</h3>
            
            {entryMode === 'lots' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Transaction History</span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={handlePasteFromClipboard}>
                      Paste CSV
                    </Button>
                    <Button type="button" size="sm" onClick={addLot}>
                      Add Transaction
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-zinc-400">
                  Tip: You can paste CSV data (date,amount,priceUSD,feesUSD) from exchanges
                </p>
                
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-300">Transaction {index + 1}</span>
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
                        <label className="block text-sm text-zinc-400 mb-1">Amount (Coins)</label>
                        <Input
                          type="number"
                          step="0.00000001"
                          {...register(`lots.${index}.amount`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.amount && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.amount?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Price USD</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="50000.00"
                          {...register(`lots.${index}.priceUSD`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.priceUSD && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.priceUSD?.message}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Fees USD (Optional)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`lots.${index}.feesUSD`, { valueAsNumber: true })}
                        />
                        {errors.lots?.[index]?.feesUSD && (
                          <p className="text-red-400 text-xs mt-1">
                            {errors.lots[index]?.feesUSD?.message}
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
                    <label className="block text-sm text-zinc-400 mb-1">Average Cost USD *</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="50000.00"
                      {...register('average.avgCostUSD', { valueAsNumber: true })}
                    />
                    {errors.average?.avgCostUSD && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.avgCostUSD.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Amount (Coins) *</label>
                    <Input
                      type="number"
                      step="0.00000001"
                      placeholder="1.5"
                      {...register('average.totalAmount', { valueAsNumber: true })}
                    />
                    {errors.average?.totalAmount && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.totalAmount.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Fees USD (Optional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('average.totalFeesUSD', { valueAsNumber: true })}
                    />
                    {errors.average?.totalFeesUSD && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.average.totalFeesUSD.message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Derived Values Display */}
            {derivedValues.totalAmount > 0 && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Total Amount:</span>
                    <span className="text-white ml-2">{derivedValues.totalAmount.toFixed(8)} {watch('asset')}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Avg Cost USD:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.avgCostUSD)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cost Basis USD:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.costBasisUSD)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 4: // Yield & Targets
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Yield & Targets</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Staking & Yield</h4>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('staking.enabled')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">This cryptocurrency is staked</span>
                </label>
                
                {watch('staking.enabled') && (
                  <>
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Estimated APY % (Optional)</label>
                      <Input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.1"
                        placeholder="5.5"
                        {...register('staking.apy', { valueAsNumber: true })}
                      />
                      {errors.staking?.apy && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.staking.apy.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Rewards Address/Note (Optional)</label>
                      <Input
                        {...register('staking.note')}
                        placeholder="Validator address or staking pool info"
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Price Targets & Alerts</h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Take Profit Price USD (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="100000.00"
                    {...register('targets.takeProfitUSD', { valueAsNumber: true })}
                  />
                  {errors.targets?.takeProfitUSD && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.takeProfitUSD.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Stop Loss Price USD (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="30000.00"
                    {...register('targets.stopLossUSD', { valueAsNumber: true })}
                  />
                  {errors.targets?.stopLossUSD && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.stopLossUSD.message}
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
                placeholder="Add any notes about this crypto position..."
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
                    { value: 'public', label: 'Public', desc: 'Anyone can see this crypto position' },
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
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Crypto Position Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Asset:</span>
                  <span className="text-white">{watch('asset')} ({side?.toUpperCase()})</span>
                </div>
                {watch('network') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Network:</span>
                    <span className="text-white">{watch('network')}</span>
                  </div>
                )}
                {watch('custody') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Custody:</span>
                    <span className="text-white">{watch('custody')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Amount:</span>
                  <span className="text-white">{derivedValues.totalAmount.toFixed(8)} {watch('asset')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Average Cost:</span>
                  <span className="text-white">{formatCurrency(derivedValues.avgCostUSD)}</span>
                </div>
                {watch('staking.enabled') && watch('staking.apy') && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Staking APY:</span>
                    <span className="text-white">{watch('staking.apy')}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Investment:</span>
                  <span className="text-white font-medium">{formatCurrency(derivedValues.costBasisUSD)}</span>
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
              {editingData ? 'Edit Crypto Position' : 'Add Crypto Position'}
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
                  {editingData ? 'Update Crypto Position' : 'Add Crypto Position'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
