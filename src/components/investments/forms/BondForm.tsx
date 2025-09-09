import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  bondSchema, 
  type BondFormData,
  type BondFrequency,
  type DayCount
} from '../../../schemas/investments/bond'
import {
  calculateAccruedInterest,
  calculateDirtyPrice,
  calculateBondCostBasis,
  calculateBondMarketValue,
  calculateApproximateYTM,
  calculateTotalQuantity,
  calculateWeightedAverageCleanPrice
} from '../../../helpers/bondMath'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface BondFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BondFormData) => Promise<void>
  editingData?: BondFormData
}

export default function BondForm({ isOpen, onClose, onSubmit, editingData }: BondFormProps) {
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
  } = useForm<BondFormData>({
    resolver: zodResolver(bondSchema),
    defaultValues: editingData || {
      instrumentType: 'bond',
      category: 'treasury',
      frequency: 'semiannual',
      dayCount: 'ACT/365',
      entryMode: 'lots',
      parPerBond: 1000,
      currency: 'USD',
      visibility: 'public',
      valuation: { source: 'manual' },
      lots: [{ 
        tradeDate: new Date().toISOString().split('T')[0], 
        quantityBonds: 0, 
        cleanPricePct: 0 
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lots'
  })

  const watchedValues = watch()

  // Calculate derived values
  const derivedValues = useMemo(() => {
    const { entryMode, lots, average, couponRate, frequency, dayCount, maturity, parPerBond, valuation } = watchedValues

    if (!maturity || !parPerBond) {
      return {
        totalQuantity: 0,
        costBasis: 0,
        accruedInterest: 0,
        dirtyPrice: 0,
        marketValue: 0,
        unrealizedPL: 0,
        approximateYTM: 0,
        weightedAvgCleanPrice: 0
      }
    }

    const maturityDate = new Date(maturity)
    const currentDate = new Date()

    let totalQuantity = 0
    let costBasis = 0
    let weightedAvgCleanPrice = 0

    if (entryMode === 'lots' && lots && lots.length > 0) {
      totalQuantity = calculateTotalQuantity(lots)
      weightedAvgCleanPrice = calculateWeightedAverageCleanPrice(lots)
      costBasis = calculateBondCostBasis(
        lots,
        couponRate || 0,
        frequency as BondFrequency,
        dayCount as DayCount,
        maturityDate,
        parPerBond
      )
    } else if (entryMode === 'average' && average) {
      totalQuantity = average.totalQuantityBonds || 0
      weightedAvgCleanPrice = average.avgCleanPricePct || 0
      costBasis = (totalQuantity * ((average.avgCleanPricePct || 0) / 100) * parPerBond) + (average.totalFees || 0)
    }

    const accruedInterest = calculateAccruedInterest(
      couponRate || 0,
      parPerBond,
      frequency as BondFrequency,
      dayCount as DayCount,
      maturityDate,
      currentDate
    )

    const markCleanPrice = valuation?.markCleanPricePct || weightedAvgCleanPrice
    const dirtyPrice = calculateDirtyPrice(markCleanPrice, accruedInterest, parPerBond)

    const marketValue = calculateBondMarketValue(
      totalQuantity,
      markCleanPrice,
      couponRate || 0,
      frequency as BondFrequency,
      dayCount as DayCount,
      maturityDate,
      parPerBond,
      currentDate
    )

    const unrealizedPL = marketValue - costBasis

    const approximateYTM = markCleanPrice > 0 ? calculateApproximateYTM(
      markCleanPrice,
      couponRate || 0,
      maturityDate,
      parPerBond,
      currentDate
    ) : 0

    return {
      totalQuantity,
      costBasis,
      accruedInterest,
      dirtyPrice,
      marketValue,
      unrealizedPL,
      approximateYTM,
      weightedAvgCleanPrice
    }
  }, [watchedValues])

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: BondFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit bond form:', error)
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

  const addLot = () => {
    append({ 
      tradeDate: new Date().toISOString().split('T')[0], 
      quantityBonds: 0, 
      cleanPricePct: 0 
    })
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Bond Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Bond Category *
              </label>
              <select
                {...register('category')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="treasury">Treasury</option>
                <option value="sovereign">Sovereign</option>
                <option value="corporate">Corporate</option>
                <option value="municipal">Municipal</option>
              </select>
              {errors.category && (
                <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Issuer *
              </label>
              <Input
                {...register('issuer')}
                placeholder="U.S. Treasury"
              />
              {errors.issuer && (
                <p className="text-red-400 text-sm mt-1">{errors.issuer.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                CUSIP/ISIN (Optional)
              </label>
              <Input
                {...register('cusip')}
                placeholder="912828XG6"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Coupon Rate % *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="2.500"
                  {...register('couponRate', { valueAsNumber: true })}
                />
                {errors.couponRate && (
                  <p className="text-red-400 text-sm mt-1">{errors.couponRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Coupon Frequency *
                </label>
                <select
                  {...register('frequency')}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="zero">Zero Coupon</option>
                  <option value="annual">Annual</option>
                  <option value="semiannual">Semi-Annual</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                </select>
                {errors.frequency && (
                  <p className="text-red-400 text-sm mt-1">{errors.frequency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Day Count Basis
                </label>
                <select
                  {...register('dayCount')}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ACT/365">ACT/365</option>
                  <option value="ACT/360">ACT/360</option>
                  <option value="30/360">30/360</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Maturity Date *
                </label>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  {...register('maturity')}
                />
                {errors.maturity && (
                  <p className="text-red-400 text-sm mt-1">{errors.maturity.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      case 2: // Position/Lots
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Position & Entry Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Par Per Bond
                </label>
                <Input
                  type="number"
                  min="1"
                  {...register('parPerBond', { valueAsNumber: true })}
                />
                <p className="text-xs text-zinc-400 mt-1">Usually 1000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Currency
                </label>
                <Input
                  {...register('currency')}
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Entry Mode *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'lots', label: 'Individual Lots', desc: 'Track each trade separately' },
                  { value: 'average', label: 'Average Entry', desc: 'Simple average cost' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('entryMode', option.value as 'lots' | 'average')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.entryMode === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-80">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {watchedValues.entryMode === 'lots' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Bond Trades</span>
                  <Button type="button" size="sm" onClick={addLot}>
                    Add Trade
                  </Button>
                </div>
                
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-zinc-300">Trade {index + 1}</span>
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
                        <label className="block text-sm text-zinc-400 mb-1">Trade Date</label>
                        <Input
                          type="date"
                          {...register(`lots.${index}.tradeDate`)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Settlement Date</label>
                        <Input
                          type="date"
                          {...register(`lots.${index}.settlementDate`)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Quantity (Bonds)</label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          {...register(`lots.${index}.quantityBonds`, { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Clean Price %</label>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="99.500"
                          {...register(`lots.${index}.cleanPricePct`, { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block text-sm text-zinc-400 mb-1">Fees (Optional)</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...register(`lots.${index}.fees`, { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Average Entry</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Average Clean Price % *</label>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="99.500"
                      {...register('average.avgCleanPricePct', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Quantity (Bonds) *</label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="100"
                      {...register('average.totalQuantityBonds', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Fees (Optional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register('average.totalFees', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 3: // Valuation & Tax
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Valuation & Tax</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Current Valuation</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Mark Source</label>
                  <div className="flex gap-3">
                    {[
                      { value: 'manual', label: 'Manual', desc: 'Enter price manually' },
                      { value: 'live', label: 'Live', desc: 'Use market data (if available)' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('valuation.source', option.value as 'manual' | 'live')}
                        className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                          watchedValues.valuation?.source === option.value
                            ? 'bg-blue-500 text-white'
                            : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}
                      >
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs opacity-80">{option.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {watchedValues.valuation?.source === 'manual' && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Current Clean Price %</label>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="100.250"
                      {...register('valuation.markCleanPricePct', { valueAsNumber: true })}
                    />
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Tax & Income (Optional)</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Withholding Tax %</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    {...register('tax.withholdingPct', { valueAsNumber: true })}
                  />
                </div>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('tax.reinvestCoupons')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Reinvest coupons automatically</span>
                </label>
                
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Tax Note</label>
                  <Input
                    {...register('tax.note')}
                    placeholder="Tax-exempt status, etc."
                  />
                </div>
              </div>
            </Card>

            {/* Derived Values Display */}
            {derivedValues.totalQuantity > 0 && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-2">Bond Analytics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Quantity:</span>
                    <span className="text-white ml-2">{derivedValues.totalQuantity} bonds</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Accrued Interest:</span>
                    <span className="text-white ml-2">{formatCurrency(derivedValues.accruedInterest)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Dirty Price:</span>
                    <span className="text-white ml-2">{derivedValues.dirtyPrice.toFixed(3)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Approx YTM:</span>
                    <span className="text-white ml-2">{derivedValues.approximateYTM.toFixed(2)}%</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 4: // Privacy & Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Privacy & Review</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this bond position..."
              />
            </div>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this bond position' },
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
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Bond Position Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Bond:</span>
                  <span className="text-white">{watchedValues.issuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Coupon:</span>
                  <span className="text-white">{watchedValues.couponRate}% {watchedValues.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Maturity:</span>
                  <span className="text-white">{watchedValues.maturity && new Date(watchedValues.maturity).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Quantity:</span>
                  <span className="text-white">{derivedValues.totalQuantity} bonds</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cost Basis:</span>
                  <span className="text-white">{formatCurrency(derivedValues.costBasis)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Market Value:</span>
                  <span className="text-white font-medium">{formatCurrency(derivedValues.marketValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Unrealized P/L:</span>
                  <span className={`font-medium ${derivedValues.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(derivedValues.unrealizedPL)}
                  </span>
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
              {editingData ? 'Edit Bond Position' : 'Add Bond Position'}
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
                  {editingData ? 'Update Bond Position' : 'Add Bond Position'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
