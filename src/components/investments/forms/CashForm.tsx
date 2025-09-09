import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  cashSchema, 
  type CashFormData
} from '../../../schemas/investments/cash'
import {
  calculateCashMetrics,
  getCurrencyInfo,
  CURRENCY_INFO,
  formatCashAmount
} from '../../../helpers/cashMath'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface CashFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CashFormData) => Promise<void>
  editingData?: CashFormData
}

export default function CashForm({ isOpen, onClose, onSubmit, editingData }: CashFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CashFormData>({
    resolver: zodResolver(cashSchema),
    defaultValues: editingData || {
      instrumentType: 'cash',
      currency: 'USD',
      amount: 0,
      compounding: 'monthly',
      autoAccrue: false,
      visibility: 'public'
    }
  })

  const watchedValues = watch()

  // Get currency info for display
  const currencyInfo = useMemo(() => {
    return getCurrencyInfo(watchedValues.currency || 'USD')
  }, [watchedValues.currency])

  // Calculate cash metrics
  const metrics = useMemo(() => {
    const { amount, apyPct, compounding } = watchedValues
    
    if (amount <= 0) return null
    
    return calculateCashMetrics(amount, apyPct || 0, compounding)
  }, [watchedValues])

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleFormSubmit = async (data: CashFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit cash form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-semibold text-white">
            {editingData ? 'Edit Cash Position' : 'Add Cash Position'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-zinc-400">✕</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="p-6 space-y-4">
            {/* Identity */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Account Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Account Label *
                </label>
                <Input
                  {...register('label')}
                  placeholder="Chase High Yield Savings"
                />
                {errors.label && (
                  <p className="text-red-400 text-sm mt-1">{errors.label.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Institution (Optional)
                </label>
                <Input
                  {...register('institution')}
                  placeholder="Chase Bank"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Currency *
                </label>
                <div className="flex gap-3">
                  <select
                    {...register('currency')}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(CURRENCY_INFO).map(([code, info]) => (
                      <option key={code} value={code}>
                        {code} - {info.name}
                      </option>
                    ))}
                  </select>
                </div>
                {currencyInfo && (
                  <p className="text-xs text-zinc-400 mt-1">
                    {currencyInfo.name} ({currencyInfo.symbol})
                  </p>
                )}
                {errors.currency && (
                  <p className="text-red-400 text-sm mt-1">{errors.currency.message}</p>
                )}
              </div>
            </div>

            {/* Balance & Yield */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Balance & Yield</h3>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Current Amount *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10000.00"
                  {...register('amount', { valueAsNumber: true })}
                />
                {errors.amount && (
                  <p className="text-red-400 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  APY % (Optional)
                </label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="4.500"
                  {...register('apyPct', { valueAsNumber: true })}
                />
                <p className="text-xs text-zinc-400 mt-1">Annual Percentage Yield</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Interest Compounding
                </label>
                <select
                  {...register('compounding')}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="none">Simple Interest (None)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('autoAccrue')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Auto-accrue interest</span>
                </label>
                <p className="text-xs text-zinc-400 mt-1">
                  Automatically calculate and add interest based on compounding schedule
                </p>
              </div>
            </div>

            {/* Interest Projections */}
            {metrics && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Interest Projections</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Monthly Interest:</span>
                    <span className="text-emerald-400">
                      +{formatCashAmount(metrics.projectedMonthlyInterest, watchedValues.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Annual Interest:</span>
                    <span className="text-emerald-400">
                      +{formatCashAmount(metrics.projectedAnnualInterest, watchedValues.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Effective Annual Rate:</span>
                    <span className="text-white">{metrics.effectiveAnnualRate.toFixed(3)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Future Value (1 year):</span>
                    <span className="text-white font-medium">
                      {formatCashAmount(metrics.futureValueOneYear, watchedValues.currency)}
                    </span>
                  </div>
                  {watchedValues.compounding !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Next Credit:</span>
                      <span className="text-white">
                        {metrics.nextCreditDate.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this cash position..."
              />
            </div>

            {/* Privacy */}
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this cash position' },
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

            {/* Summary */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Cash Position Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account:</span>
                  <span className="text-white">{watchedValues.label || 'Cash Account'}</span>
                </div>
                {watchedValues.institution && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Institution:</span>
                    <span className="text-white">{watchedValues.institution}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Currency:</span>
                  <span className="text-white">{watchedValues.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Current Balance:</span>
                  <span className="text-white font-medium">
                    {formatCashAmount(watchedValues.amount || 0, watchedValues.currency)}
                  </span>
                </div>
                {watchedValues.apyPct && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">APY:</span>
                    <span className="text-white">{watchedValues.apyPct}% ({watchedValues.compounding})</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-700 bg-zinc-800/50">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingData ? 'Update Cash Position' : 'Add Cash Position'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
