import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  commoditySchema, 
  type CommodityFormData
} from '../../../schemas/investments/commodity'
import {
  calculateSpotNotional,
  calculateFuturesNotional,
  calculateSpotPL,
  calculateFuturesPL,
  calculateDaysToExpiry,
  calculateCommodityCostBasis,
  formatContractCode,
  getCommodityInfo,
  COMMODITY_INFO
} from '../../../helpers/commodityMath'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface CommodityFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CommodityFormData) => Promise<void>
  editingData?: CommodityFormData
}

export default function CommodityForm({ isOpen, onClose, onSubmit, editingData }: CommodityFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CommodityFormData>({
    resolver: zodResolver(commoditySchema),
    defaultValues: editingData || {
      instrumentType: 'commodity',
      mode: 'spot',
      currency: 'USD',
      entryDate: new Date().toISOString().split('T')[0],
      visibility: 'public'
    }
  })

  const watchedValues = watch()

  // Get commodity info for auto-fill
  const commodityInfo = useMemo(() => {
    if (watchedValues.symbol) {
      return getCommodityInfo(watchedValues.symbol)
    }
    return null
  }, [watchedValues.symbol])

  // Auto-fill fields when symbol changes
  const handleSymbolChange = (symbol: string) => {
    setValue('symbol', symbol.toUpperCase())
    
    const info = getCommodityInfo(symbol.toUpperCase())
    if (info.unitType && watchedValues.mode === 'spot') {
      setValue('unitType', info.unitType)
    }
    if (info.venue) {
      setValue('venue', info.venue)
    }
    if (info.standardMultiplier && watchedValues.mode === 'futures') {
      setValue('multiplier', info.standardMultiplier)
    }
  }

  // Calculate derived values
  const derivedValues = useMemo(() => {
    const { mode, units, entryPricePerUnit, contracts, multiplier, entryPricePerUnitFut, fees, contractMonth, contractYear } = watchedValues

    let notional = 0
    let costBasis = 0
    let daysToExpiry = 0

    if (mode === 'spot' && units && entryPricePerUnit) {
      notional = calculateSpotNotional(units, entryPricePerUnit)
      costBasis = calculateCommodityCostBasis('spot', units, entryPricePerUnit, 1, fees || 0)
    } else if (mode === 'futures' && contracts && multiplier && entryPricePerUnitFut) {
      notional = calculateFuturesNotional(contracts, multiplier, entryPricePerUnitFut)
      costBasis = calculateCommodityCostBasis('futures', contracts, entryPricePerUnitFut, multiplier, fees || 0)
      
      if (contractMonth && contractYear) {
        daysToExpiry = calculateDaysToExpiry(contractMonth, contractYear)
      }
    }

    // For display purposes, assume current price = entry price (no live price yet)
    const unrealizedPL = 0 // Would be calculated with live prices

    return {
      notional,
      costBasis,
      daysToExpiry,
      unrealizedPL
    }
  }, [watchedValues])

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: CommodityFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit commodity form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Commodity Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Commodity Symbol *
              </label>
              <Input
                {...register('symbol')}
                onChange={(e) => handleSymbolChange(e.target.value)}
                placeholder="CL, GC, XAU, WTI"
                className="uppercase"
              />
              {commodityInfo && (
                <p className="text-xs text-zinc-400 mt-1">{commodityInfo.name}</p>
              )}
              {errors.symbol && (
                <p className="text-red-400 text-sm mt-1">{errors.symbol.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Instrument Type *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'spot', label: 'Spot', desc: 'Physical commodity or spot price' },
                  { value: 'futures', label: 'Futures', desc: 'Futures contract' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('mode', option.value as 'spot' | 'futures')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.mode === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
              {errors.mode && (
                <p className="text-red-400 text-sm mt-1">{errors.mode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Venue/Exchange (Optional)
              </label>
              <Input
                {...register('venue')}
                placeholder="NYMEX, COMEX, LME"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Currency
              </label>
              <Input
                {...register('currency')}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
              />
            </div>
          </div>
        )

      case 2: // Exposure Details
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {watchedValues.mode === 'spot' ? 'Spot Position' : 'Futures Contract'} Details
            </h3>
            
            {watchedValues.mode === 'spot' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Quantity (Units) *
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="100"
                      {...register('units', { valueAsNumber: true })}
                    />
                    {errors.units && (
                      <p className="text-red-400 text-sm mt-1">{errors.units.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Unit Type *
                    </label>
                    <Input
                      {...register('unitType')}
                      placeholder="oz, bbl, lb, bu"
                    />
                    {errors.unitType && (
                      <p className="text-red-400 text-sm mt-1">{errors.unitType.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Entry Price per Unit *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="75.50"
                    {...register('entryPricePerUnit', { valueAsNumber: true })}
                  />
                  {errors.entryPricePerUnit && (
                    <p className="text-red-400 text-sm mt-1">{errors.entryPricePerUnit.message}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Contract Code *
                  </label>
                  <Input
                    {...register('contractCode')}
                    placeholder="CLZ5"
                    className="uppercase"
                  />
                  <p className="text-xs text-zinc-400 mt-1">e.g., CLZ5 = Crude Oil December 2025</p>
                  {errors.contractCode && (
                    <p className="text-red-400 text-sm mt-1">{errors.contractCode.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Contract Month *
                    </label>
                    <select
                      {...register('contractMonth')}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select month...</option>
                      <option value="F">F - January</option>
                      <option value="G">G - February</option>
                      <option value="H">H - March</option>
                      <option value="J">J - April</option>
                      <option value="K">K - May</option>
                      <option value="M">M - June</option>
                      <option value="N">N - July</option>
                      <option value="Q">Q - August</option>
                      <option value="U">U - September</option>
                      <option value="V">V - October</option>
                      <option value="X">X - November</option>
                      <option value="Z">Z - December</option>
                    </select>
                    {errors.contractMonth && (
                      <p className="text-red-400 text-sm mt-1">{errors.contractMonth.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Contract Year *
                    </label>
                    <Input
                      type="number"
                      min="2024"
                      max="2030"
                      placeholder="2025"
                      {...register('contractYear', { valueAsNumber: true })}
                    />
                    {errors.contractYear && (
                      <p className="text-red-400 text-sm mt-1">{errors.contractYear.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Number of Contracts *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="10"
                      {...register('contracts', { valueAsNumber: true })}
                    />
                    {errors.contracts && (
                      <p className="text-red-400 text-sm mt-1">{errors.contracts.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Contract Multiplier *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1000"
                      {...register('multiplier', { valueAsNumber: true })}
                    />
                    <p className="text-xs text-zinc-400 mt-1">Units per contract</p>
                    {errors.multiplier && (
                      <p className="text-red-400 text-sm mt-1">{errors.multiplier.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tick Size (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.01"
                      {...register('tickSize', { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Tick Value (Optional)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      {...register('tickValue', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Entry Price per Unit *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="75.50"
                    {...register('entryPricePerUnitFut', { valueAsNumber: true })}
                  />
                  {errors.entryPricePerUnitFut && (
                    <p className="text-red-400 text-sm mt-1">{errors.entryPricePerUnitFut.message}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Entry Date *
                </label>
                <Input
                  type="date"
                  {...register('entryDate')}
                />
                {errors.entryDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.entryDate.message}</p>
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
                  placeholder="25.00"
                  {...register('fees', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        )

      case 3: // Targets & Risk
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Targets & Risk Management</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Price Targets</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Target Price per Unit</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="85.00"
                    {...register('targets.targetPrice', { valueAsNumber: true })}
                  />
                  {errors.targets?.targetPrice && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.targetPrice.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Stop Price per Unit</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="70.00"
                    {...register('targets.stopPrice', { valueAsNumber: true })}
                  />
                  {errors.targets?.stopPrice && (
                    <p className="text-red-400 text-xs mt-1">
                      {errors.targets.stopPrice.message}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {watchedValues.mode === 'futures' && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Margin & Risk</h4>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Margin Posted (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000.00"
                    {...register('marginPosted', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-400 mt-1">Initial margin requirement</p>
                </div>
              </Card>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this commodity position..."
              />
            </div>

            {/* Derived Values Display */}
            {derivedValues.notional > 0 && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Position Analytics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Notional Value:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.notional)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cost Basis:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.costBasis)}</span>
                  </div>
                  {watchedValues.mode === 'futures' && derivedValues.daysToExpiry > 0 && (
                    <div>
                      <span className="text-zinc-400">Days to Expiry:</span>
                      <span className="text-white ml-2">{derivedValues.daysToExpiry}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )

      case 4: // Privacy & Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Privacy & Review</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this commodity position' },
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
              </div>
            </Card>

            {/* Final Review */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Commodity Position Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Commodity:</span>
                  <span className="text-white">{watchedValues.symbol} ({watchedValues.mode})</span>
                </div>
                {commodityInfo && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Description:</span>
                    <span className="text-white">{commodityInfo.name}</span>
                  </div>
                )}
                {watchedValues.mode === 'spot' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Quantity:</span>
                      <span className="text-white">{watchedValues.units} {watchedValues.unitType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Entry Price:</span>
                      <span className="text-white">{formatCurrency(watchedValues.entryPricePerUnit || 0)} per {watchedValues.unitType}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Contract:</span>
                      <span className="text-white">{watchedValues.contractCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Contracts:</span>
                      <span className="text-white">{watchedValues.contracts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Entry Price:</span>
                      <span className="text-white">{formatCurrency(watchedValues.entryPricePerUnitFut || 0)}</span>
                    </div>
                    {derivedValues.daysToExpiry > 0 && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Days to Expiry:</span>
                        <span className="text-white">{derivedValues.daysToExpiry}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Notional Value:</span>
                  <span className="text-white font-medium">{formatCurrency(derivedValues.notional)}</span>
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
              {editingData ? 'Edit Commodity Position' : 'Add Commodity Position'}
            </h2>
            <div className="text-sm text-zinc-400">
              Step {step} of 4
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
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  i < step ? 'bg-blue-500 text-white' :
                  i === step ? 'bg-blue-500/20 text-blue-300 border-2 border-blue-500' :
                  'bg-zinc-700 text-zinc-400'
                }`}>
                  {i}
                </div>
                {i < 4 && (
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
              {step < 4 ? (
                <Button type="button" onClick={nextStep}>
                  Next →
                </Button>
              ) : (
                <Button type="submit" isLoading={isSubmitting}>
                  {editingData ? 'Update Commodity Position' : 'Add Commodity Position'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
