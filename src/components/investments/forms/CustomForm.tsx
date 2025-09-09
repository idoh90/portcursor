import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  customSchema, 
  type CustomFormData
} from '../../../schemas/investments/custom'
import {
  calculateCustomMetrics,
  testExpression,
  formatQuantity,
  PRICE_ADAPTERS,
  CUSTOM_CATEGORIES,
  COMMON_UNIT_NAMES
} from '../../../helpers/customMath'
import Button from '../../ui/Button'
import Input from '../../ui/Input'
import Card from '../../ui/Card'
import Modal from '../../ui/Modal'
import { formatCurrency } from '../../../lib/format'

interface CustomFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CustomFormData) => Promise<void>
  editingData?: CustomFormData
}

export default function CustomForm({ isOpen, onClose, onSubmit, editingData }: CustomFormProps) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expressionTest, setExpressionTest] = useState<{ result: number; error?: string } | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<CustomFormData>({
    resolver: zodResolver(customSchema),
    defaultValues: editingData || {
      instrumentType: 'custom',
      definition: {
        currency: 'USD',
        unitName: 'units',
        quantityPrecision: 2,
        multiplier: 1,
        entryMode: 'lots',
        priceSource: { type: 'manual' },
        plModel: { type: 'standard' }
      },
      state: {
        markAsOf: new Date().toISOString().split('T')[0],
        visibility: 'public',
        income: { kind: 'none' },
        lots: [{ date: new Date().toISOString().split('T')[0], quantity: 0, unitCost: 0 }]
      }
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'state.lots'
  })

  const watchedValues = watch()

  // Calculate derived metrics
  const metrics = useMemo(() => {
    if (!watchedValues.definition || !watchedValues.state) return null
    
    return calculateCustomMetrics(watchedValues.definition, watchedValues.state)
  }, [watchedValues])

  const handleClose = () => {
    reset()
    setStep(1)
    setExpressionTest(null)
    onClose()
  }

  const handleFormSubmit = async (data: CustomFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      handleClose()
    } catch (error) {
      console.error('Failed to submit custom form:', error)
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
    append({ date: new Date().toISOString().split('T')[0], quantity: 0, unitCost: 0 })
  }

  const handleTestExpression = () => {
    const expression = watchedValues.definition?.plModel?.expression
    if (expression) {
      setExpressionTest(testExpression(expression))
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Identity
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Custom Instrument Identity</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Instrument Label *
              </label>
              <Input
                {...register('definition.label')}
                placeholder="Gold Bars"
              />
              {errors.definition?.label && (
                <p className="text-red-400 text-sm mt-1">{errors.definition.label.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Short Symbol/Slug (Optional)
              </label>
              <Input
                {...register('definition.slug')}
                placeholder="gold-bars"
              />
              <p className="text-xs text-zinc-400 mt-1">
                Unique identifier (a-z, 0-9, hyphens only)
              </p>
              {errors.definition?.slug && (
                <p className="text-red-400 text-sm mt-1">{errors.definition.slug.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Category (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  {...register('definition.category')}
                  className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select category...</option>
                  {CUSTOM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
                <Input
                  {...register('definition.category')}
                  placeholder="or type custom"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Base Currency
              </label>
              <Input
                {...register('definition.currency')}
                placeholder="USD"
                maxLength={3}
                className="uppercase"
              />
            </div>
          </div>
        )

      case 2: // Units & Entry
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Units & Entry Mode</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Unit Name *
                </label>
                <div className="flex gap-2">
                  <select
                    {...register('definition.unitName')}
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select unit...</option>
                    {COMMON_UNIT_NAMES.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                  <Input
                    {...register('definition.unitName')}
                    placeholder="or custom"
                    className="flex-1"
                  />
                </div>
                {errors.definition?.unitName && (
                  <p className="text-red-400 text-sm mt-1">{errors.definition.unitName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Decimal Precision
                </label>
                <select
                  {...register('definition.quantityPrecision', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(precision => (
                    <option key={precision} value={precision}>{precision} decimals</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Value Multiplier
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register('definition.multiplier', { valueAsNumber: true })}
              />
              <p className="text-xs text-zinc-400 mt-1">
                Used in P/L calculations (default: 1)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Entry Mode *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'lots', label: 'Individual Lots', desc: 'Track each transaction' },
                  { value: 'average', label: 'Average Cost', desc: 'Simple average entry' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('definition.entryMode', option.value as 'lots' | 'average')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.definition?.entryMode === option.value
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

            {watchedValues.definition?.entryMode === 'lots' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Transaction Lots</span>
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
                          {...register(`state.lots.${index}.date`)}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">
                          Quantity ({watchedValues.definition?.unitName || 'units'})
                        </label>
                        <Input
                          type="number"
                          step={1 / Math.pow(10, watchedValues.definition?.quantityPrecision || 2)}
                          min="0"
                          {...register(`state.lots.${index}.quantity`, { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">
                          Unit Cost ({watchedValues.definition?.currency})
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`state.lots.${index}.unitCost`, { valueAsNumber: true })}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">Fees (Optional)</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...register(`state.lots.${index}.fees`, { valueAsNumber: true })}
                        />
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
                    <label className="block text-sm text-zinc-400 mb-1">
                      Average Unit Cost ({watchedValues.definition?.currency}) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="100.00"
                      {...register('state.average.avgUnitCost', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      Total Quantity ({watchedValues.definition?.unitName || 'units'}) *
                    </label>
                    <Input
                      type="number"
                      step={1 / Math.pow(10, watchedValues.definition?.quantityPrecision || 2)}
                      min="0"
                      placeholder="100"
                      {...register('state.average.totalQuantity', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Total Fees (Optional)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register('state.average.totalFees', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        )

      case 3: // Price/Valuation
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Price & Valuation</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Price Source *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'manual', label: 'Manual', desc: 'Enter price manually' },
                  { value: 'external', label: 'External API', desc: 'Automatic price feed' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('definition.priceSource.type', option.value as 'manual' | 'external')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.definition?.priceSource?.type === option.value
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

            {watchedValues.definition?.priceSource?.type === 'external' && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">External Price Feed</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Adapter *</label>
                    <select
                      {...register('definition.priceSource.adapter')}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select adapter...</option>
                      {Object.entries(PRICE_ADAPTERS).map(([key, info]) => (
                        <option key={key} value={key}>{info.name} - {info.description}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Symbol *</label>
                    <Input
                      {...register('definition.priceSource.adapterSymbol')}
                      placeholder={
                        watchedValues.definition?.priceSource?.adapter ? 
                        PRICE_ADAPTERS[watchedValues.definition.priceSource.adapter as keyof typeof PRICE_ADAPTERS]?.symbolExample :
                        'SYMBOL'
                      }
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Price Path (Optional)</label>
                    <Input
                      {...register('definition.priceSource.pricePath')}
                      placeholder="$.data.price"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      JSONPath to price in API response
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Current Mark Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="150.00"
                  {...register('state.markPrice', { valueAsNumber: true })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Mark As Of
                </label>
                <Input
                  type="date"
                  {...register('state.markAsOf')}
                />
              </div>
            </div>

            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Income/Yield (Optional)</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Yield Type</label>
                  <select
                    {...register('state.income.kind')}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="none">None</option>
                    <option value="apy">APY %</option>
                    <option value="fixed">Fixed Amount per Year</option>
                  </select>
                </div>
                
                {watchedValues.state?.income?.kind !== 'none' && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">
                      {watchedValues.state?.income?.kind === 'apy' ? 'APY %' : 'Annual Amount'}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={watchedValues.state?.income?.kind === 'apy' ? '5.0' : '1000.00'}
                      {...register('state.income.value', { valueAsNumber: true })}
                    />
                  </div>
                )}
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register('state.income.reinvest')}
                    className="rounded border-zinc-600 bg-zinc-700 text-blue-500"
                  />
                  <span className="text-sm text-zinc-300">Reinvest income automatically</span>
                </label>
              </div>
            </Card>
          </div>
        )

      case 4: // P/L Model & Privacy
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">P/L Model & Privacy</h3>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                P/L Calculation Model *
              </label>
              <div className="flex gap-3">
                {[
                  { value: 'standard', label: 'Standard', desc: '(mark - avgCost) × quantity × multiplier - fees' },
                  { value: 'expression', label: 'Custom Expression', desc: 'Write your own formula' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('definition.plModel.type', option.value as 'standard' | 'expression')}
                    className={`flex-1 p-3 rounded-lg text-left transition-colors ${
                      watchedValues.definition?.plModel?.type === option.value
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

            {watchedValues.definition?.plModel?.type === 'expression' && (
              <Card className="p-4">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Custom P/L Expression</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Expression *</label>
                    <textarea
                      {...register('definition.plModel.expression')}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
                      placeholder="(mark - avgCost) * quantity * multiplier - feesTotal"
                    />
                    <p className="text-xs text-zinc-400 mt-1">
                      Available variables: quantity, avgCost, mark, multiplier, feesTotal
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleTestExpression}>
                      Test Expression
                    </Button>
                    {expressionTest && (
                      <div className="text-sm">
                        {expressionTest.error ? (
                          <span className="text-red-400">Error: {expressionTest.error}</span>
                        ) : (
                          <span className="text-emerald-400">
                            Result: {formatCurrency(expressionTest.result)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Notes (Optional)</label>
              <textarea
                {...register('state.notes')}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Add any notes about this custom instrument..."
              />
            </div>
            
            <Card className="p-4">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Privacy Settings</h4>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Visibility *</label>
                <div className="space-y-2">
                  {[
                    { value: 'public', label: 'Public', desc: 'Anyone can see this position' },
                    { value: 'friends', label: 'Friends Only', desc: 'Only your friends can see this' },
                    { value: 'private', label: 'Private', desc: 'Only you can see this position' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        value={option.value}
                        {...register('state.visibility')}
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
          </div>
        )

      case 5: // Review
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Review & Finalize</h3>
            
            {/* Metrics Display */}
            {metrics && (
              <Card className="p-4 bg-zinc-800/50">
                <h4 className="text-sm font-medium text-zinc-300 mb-3">Position Analytics</h4>
                
                {metrics.plError && (
                  <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    P/L Error: {metrics.plError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Total Quantity:</span>
                    <span className="text-white ml-2">
                      {formatQuantity(metrics.totalQuantity, watchedValues.definition?.quantityPrecision)} {watchedValues.definition?.unitName}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Avg Cost:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.avgCost)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Cost Basis:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.costBasis)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Current Mark:</span>
                    <span className="text-white ml-2">{formatCurrency(watchedValues.state?.markPrice || 0)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Notional Value:</span>
                    <span className="text-white ml-2">{formatCurrency(metrics.notional)}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Unrealized P/L:</span>
                    <span className={`ml-2 font-medium ${metrics.unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(metrics.unrealizedPL)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Position Summary */}
            <Card className="p-4 bg-zinc-800/50">
              <h4 className="text-sm font-medium text-zinc-300 mb-3">Custom Instrument Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Instrument:</span>
                  <span className="text-white">{watchedValues.definition?.label}</span>
                </div>
                {watchedValues.definition?.slug && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Symbol:</span>
                    <span className="text-white">{watchedValues.definition.slug}</span>
                  </div>
                )}
                {watchedValues.definition?.category && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Category:</span>
                    <span className="text-white capitalize">{watchedValues.definition.category.replace('-', ' ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Units:</span>
                  <span className="text-white">{watchedValues.definition?.unitName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">P/L Model:</span>
                  <span className="text-white capitalize">{watchedValues.definition?.plModel?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Price Source:</span>
                  <span className="text-white capitalize">{watchedValues.definition?.priceSource?.type}</span>
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
              {editingData ? 'Edit Custom Instrument' : 'Add Custom Instrument'}
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
                  {editingData ? 'Update Custom Instrument' : 'Add Custom Instrument'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
