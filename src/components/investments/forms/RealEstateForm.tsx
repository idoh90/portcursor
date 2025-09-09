import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  realEstateSchema, 
  type RealEstateFormData
} from '../../../schemas/investments/realEstate'
import {
  calculateRealEstateMetrics,
  calculateMortgagePayment
} from '../../../helpers/realEstateMath'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface RealEstateFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RealEstateFormData) => Promise<void>
  editingData?: RealEstateFormData
}

export default function RealEstateForm({ isOpen, onClose, onSubmit, editingData }: RealEstateFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<RealEstateFormData>({
    resolver: zodResolver(realEstateSchema),
    defaultValues: editingData || {
      instrumentType: 'real_estate',
      propertyType: 'residential',
      currency: 'USD',
      acquisition: {
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0
      },
      valuation: {
        currentValue: 0,
        valuationDate: new Date().toISOString().split('T')[0]
      },
      financing: {
        hasMortgage: false
      },
      visibility: 'public'
    }
  })

  const watchedValues = watch()

  // Calculate mortgage payment when financing details change
  const estimatedMortgagePayment = useMemo(() => {
    const { financing } = watchedValues
    if (financing?.hasMortgage && financing.principal && financing.interestRatePct && financing.termMonths) {
      return calculateMortgagePayment(financing.principal, financing.interestRatePct, financing.termMonths)
    }
    return 0
  }, [watchedValues.financing])

  // Update calculated mortgage payment
  const handleMortgageCalculation = () => {
    if (estimatedMortgagePayment > 0) {
      setValue('financing.monthlyPayment', estimatedMortgagePayment)
    }
  }

  // Calculate derived real estate metrics
  const metrics = useMemo(() => {
    const { acquisition, valuation, income, expenses, financing } = watchedValues
    
    if (!acquisition?.purchasePrice || !valuation?.currentValue) {
      return null
    }

    return calculateRealEstateMetrics(acquisition, valuation, income, expenses, financing)
  }, [watchedValues])

  const handleClose = () => {
    reset()
    setStep(1)
    onClose()
  }

  const handleFormSubmit = async (data: RealEstateFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit real estate form:', error)
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
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Property Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Property Name/Label *
              </label>
              <Input
                {...register('label')}
                placeholder="Main Street Duplex"
              />
              {errors.label && (
                <p className="text-red-400 text-sm mt-1">{errors.label.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Property Type *
              </label>
              <select
                {...register('propertyType')}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="mixed">Mixed Use</option>
              </select>
              {errors.propertyType && (
                <p className="text-red-400 text-sm mt-1">{errors.propertyType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Country (Optional)
                </label>
                <Input
                  {...register('location.country')}
                  placeholder="United States"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  City (Optional)
                </label>
                <Input
                  {...register('location.city')}
                  placeholder="San Francisco"
                />
              </div>
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

      case 2: // Acquisition
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Acquisition Details</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Purchase Date *
                </label>
                <Input
                  type="date"
                  {...register('acquisition.purchaseDate')}
                />
                {errors.acquisition?.purchaseDate && (
                  <p className="text-red-400 text-sm mt-1">{errors.acquisition.purchaseDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Purchase Price *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500000"
                  {...register('acquisition.purchasePrice', { valueAsNumber: true })}
                />
                {errors.acquisition?.purchasePrice && (
                  <p className="text-red-400 text-sm mt-1">{errors.acquisition.purchasePrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Closing Costs (Optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15000"
                  {...register('acquisition.closingCosts', { valueAsNumber: true })}
                />
                <p className="text-xs text-zinc-400 mt-1">Title, escrow, inspection fees</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Improvements to Date (Optional)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="25000"
                  {...register('acquisition.improvementsToDate', { valueAsNumber: true })}
                />
                <p className="text-xs text-zinc-400 mt-1">Renovations, upgrades</p>
              </div>
            </div>
          </div>
        )

      case 3: // Financing
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Financing Details</h3>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('financing.hasMortgage')}
                  className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                />
                <span className="text-sm text-zinc-300">This property has a mortgage</span>
              </label>
            </div>

            {watchedValues.financing?.hasMortgage && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Mortgage Details</h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Loan Principal *</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="400000"
                        {...register('financing.principal', { valueAsNumber: true })}
                      />
                      {errors.financing?.principal && (
                        <p className="text-red-400 text-xs mt-1">{errors.financing.principal.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Interest Rate % *</label>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="6.5"
                        {...register('financing.interestRatePct', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Term (Months)</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="360"
                        {...register('financing.termMonths', { valueAsNumber: true })}
                      />
                      <p className="text-xs text-zinc-400 mt-1">360 = 30 years</p>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-1">Monthly Payment</label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="2500"
                          {...register('financing.monthlyPayment', { valueAsNumber: true })}
                        />
                        {estimatedMortgagePayment > 0 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleMortgageCalculation}
                          >
                            Calc
                          </Button>
                        )}
                      </div>
                      {estimatedMortgagePayment > 0 && (
                        <p className="text-xs text-zinc-400 mt-1">
                          Estimated: {formatCurrency(estimatedMortgagePayment)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 4: // Income & Expenses
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Income & Expenses</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Monthly Income</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Monthly Rent</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3000"
                    {...register('income.monthlyRent', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Other Monthly Income</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200"
                    {...register('income.otherMonthlyIncome', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-400 mt-1">Parking, laundry, etc.</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Monthly Expenses</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Maintenance</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="300"
                    {...register('expenses.maintenance', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Property Taxes</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="800"
                    {...register('expenses.taxes', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Insurance</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="200"
                    {...register('expenses.insurance', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Property Management</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="240"
                    {...register('expenses.management', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-400 mt-1">Usually 8-12% of rent</p>
                </div>
              </div>
            </Card>
          </div>
        )

      case 5: // Valuation & Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Current Valuation & Review</h3>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Current Valuation</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Current Property Value *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="550000"
                    {...register('valuation.currentValue', { valueAsNumber: true })}
                  />
                  {errors.valuation?.currentValue && (
                    <p className="text-red-400 text-xs mt-1">{errors.valuation.currentValue.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Valuation Date *</label>
                  <Input
                    type="date"
                    {...register('valuation.valuationDate')}
                  />
                  {errors.valuation?.valuationDate && (
                    <p className="text-red-400 text-xs mt-1">{errors.valuation.valuationDate.message}</p>
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
                placeholder="Add any notes about this property..."
              />
            </div>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this property' },
                    { value: 'friends', label: 'Friends Only', desc: 'Only your friends can see this' },
                    { value: 'private', label: 'Private', desc: 'Only you can see this property' }
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

            {/* Real Estate Analytics */}
            {metrics && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Property Analytics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Total Cost Basis:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.totalCostBasis)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Equity:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.equity)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Monthly Cash Flow:</span>
                    <span className={`ml-2 ${metrics.monthlyCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.monthlyCashFlow)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Annual NOI:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.noi)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cap Rate:</span>
                    <span className="text-white ml-2">{metrics.capRate.toFixed(2)}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Appreciation:</span>
                    <span className="text-white ml-2">{metrics.appreciationRate.toFixed(2)}% annual</span>
                  </div>
                  {metrics.loanToValue > 0 && (
                    <div>
                      <span className="text-zinc-400">Loan-to-Value:</span>
                      <span className="text-white ml-2">{metrics.loanToValue.toFixed(1)}%</span>
                    </div>
                  )}
                  <div>
                    <span className="text-zinc-400">Unrealized P/L:</span>
                    <span className={`ml-2 font-medium ${metrics.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.unrealizedPL)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Final Review */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Property Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Property:</span>
                  <span className="text-white">{watchedValues.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Type:</span>
                  <span className="text-white capitalize">{watchedValues.propertyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Purchase Price:</span>
                  <span className="text-white">{formatCurrency(watchedValues.acquisition?.purchasePrice || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Value:</span>
                  <span className="text-white font-medium">{formatCurrency(watchedValues.valuation?.currentValue || 0)}</span>
                </div>
                {watchedValues.financing?.hasMortgage && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Mortgaged:</span>
                    <span className="text-white">Yes ({formatCurrency(watchedValues.financing.principal || 0)})</span>
                  </div>
                )}
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
              {editingData ? 'Edit Real Estate Position' : 'Add Real Estate Position'}
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
                  {editingData ? 'Update Property' : 'Add Property'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
