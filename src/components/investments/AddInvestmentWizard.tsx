import { useState, useEffect } from 'react'
import { useInvestmentsStore } from '../../features/investments/store'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Card from '../ui/Card'
import FieldRenderer from './FieldRenderer'
import LotsEditor from './LotsEditor'
import StockForm from './forms/StockForm'
import EtfForm from './forms/EtfForm'
import OptionForm from './forms/OptionForm'
import CryptoForm from './forms/CryptoForm'
import BondForm from './forms/BondForm'
import CommodityForm from './forms/CommodityForm'
import RealEstateForm from './forms/RealEstateForm'
import CashForm from './forms/CashForm'
import CustomForm from './forms/CustomForm'
import { useUpsertStock } from '../../hooks/useUpsertStock'
import { useUpsertCustom } from '../../hooks/useUpsertCustom'
// import { validateInvestmentData } from '../../lib/investmentValidation'
import type { InvestmentType, InvestmentDraft, Lot } from '../../features/investments/types'
import type { StockFormData } from '../../schemas/investments/stock'
import type { EtfFormData } from '../../schemas/investments/etf'
import type { OptionFormData } from '../../schemas/investments/option'
import type { CryptoFormData } from '../../schemas/investments/crypto'
import type { BondFormData } from '../../schemas/investments/bond'
import type { CommodityFormData } from '../../schemas/investments/commodity'
import type { RealEstateFormData } from '../../schemas/investments/realEstate'
import type { CashFormData } from '../../schemas/investments/cash'
import type { CustomFormData } from '../../schemas/investments/custom'

interface AddInvestmentWizardProps {
  isOpen: boolean
  onClose: () => void
  editingId?: string
}

const INVESTMENT_TYPES: { value: InvestmentType; label: string; description: string }[] = [
  { value: 'stock', label: 'Stock', description: 'Individual company shares' },
  { value: 'etf', label: 'ETF', description: 'Exchange-traded funds' },
  { value: 'option', label: 'Option', description: 'Call and put options' },
  { value: 'crypto', label: 'Cryptocurrency', description: 'Digital currencies' },
  { value: 'bond', label: 'Bond/Treasury', description: 'Fixed income securities' },
  { value: 'commodity', label: 'Commodity', description: 'Physical goods and futures' },
  { value: 'real_estate', label: 'Real Estate', description: 'Property investments' },
  { value: 'cash', label: 'Cash', description: 'Cash positions and savings' },
  { value: 'custom', label: 'Custom', description: 'Custom investment types' },
]

export default function AddInvestmentWizard({ isOpen, onClose, editingId }: AddInvestmentWizardProps) {
  const { addInvestment, updateInvestment, saveDraft, loadDraft, clearDraft } = useInvestmentsStore()
  const { upsertStock } = useUpsertStock()
  const { upsertCustom } = useUpsertCustom()
  
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<InvestmentType | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showEnhancedForm, setShowEnhancedForm] = useState(false)

  const draftId = editingId || 'new-investment'

  // Load draft on open
  useEffect(() => {
    if (isOpen) {
      const draft = loadDraft(draftId)
      if (draft) {
        setStep(draft.step)
        setSelectedType(draft.type)
        setFormData(draft.data)
      }
    }
  }, [isOpen, draftId, loadDraft])

  // Auto-save draft
  useEffect(() => {
    if (isOpen && (selectedType || Object.keys(formData).length > 0)) {
      const draft: InvestmentDraft = {
        type: selectedType!,
        step,
        data: formData,
        lastSaved: new Date().toISOString(),
      }
      saveDraft(draftId, draft)
    }
  }, [step, selectedType, formData, isOpen, draftId, saveDraft])

  const handleClose = () => {
    // Ask for confirmation if there are unsaved changes
    if (selectedType || Object.keys(formData).length > 0) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        clearDraft(draftId)
        resetForm()
        onClose()
      }
    } else {
      onClose()
    }
  }

  const resetForm = () => {
    setStep(1)
    setSelectedType(null)
    setFormData({})
    setErrors({})
  }

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return
    }

    if (step === 1 && selectedType) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      // Convert single lot entry to lots array
      if (formData.entryMethod !== 'multiple' && formData.quantity && formData.price && formData.date) {
        const lot: Lot = {
          id: crypto.randomUUID(),
          quantity: parseFloat(formData.quantity?.toString() || '0'),
          price: parseFloat(formData.price?.toString() || '0'),
          fees: parseFloat(formData.fees?.toString() || '0'),
          date: formData.date || new Date().toISOString().split('T')[0],
          notes: formData.notes,
        }
        setFormData((prev: any) => ({ ...prev, lots: [lot] }))
      }
      setStep(4)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // Enhanced form handlers for the new form types
  const handleStockSubmit = async (data: StockFormData) => {
    await upsertStock(data, editingId)
  }

  const handleEtfSubmit = async (data: EtfFormData) => {
    await upsertStock(data as any, editingId) // Reuse stock handler for now
  }

  const handleOptionSubmit = async (data: OptionFormData) => {
    // TODO: Implement option-specific handler
    console.log('Option data:', data)
  }

  const handleCryptoSubmit = async (data: CryptoFormData) => {
    // TODO: Implement crypto-specific handler
    console.log('Crypto data:', data)
  }

  const handleBondSubmit = async (data: BondFormData) => {
    // TODO: Implement bond-specific handler
    console.log('Bond data:', data)
  }

  const handleCommoditySubmit = async (data: CommodityFormData) => {
    // TODO: Implement commodity-specific handler
    console.log('Commodity data:', data)
  }

  const handleRealEstateSubmit = async (data: RealEstateFormData) => {
    // TODO: Implement real estate-specific handler
    console.log('Real Estate data:', data)
  }

  const handleCashSubmit = async (data: CashFormData) => {
    // TODO: Implement cash-specific handler
    console.log('Cash data:', data)
  }

  const handleCustomSubmit = async (data: CustomFormData) => {
    await upsertCustom(data, editingId)
  }

  const handleTypeSelection = (type: InvestmentType) => {
    setSelectedType(type)
    // For enhanced forms, skip to the form directly
    if (['stock', 'etf', 'option', 'crypto', 'bond', 'commodity', 'real_estate', 'cash', 'custom'].includes(type)) {
      setShowEnhancedForm(true)
    } else {
      setShowEnhancedForm(false)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const investmentData = {
        type: selectedType!,
        ...formData,
        lots: formData.lots || [],
        privacy: formData.privacy || {
          showPosition: true,
          showLots: true,
          showPnL: true,
        },
      }

      if (editingId) {
        await updateInvestment(editingId, investmentData)
      } else {
        await addInvestment(investmentData)
      }

      clearDraft(draftId)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Failed to save investment:', error)
      // Handle error
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1 && !selectedType) {
      newErrors.type = 'Please select an investment type'
    }
    
    if (step === 2 && selectedType) {
      // Validate basic fields using the schema
      // TODO: Add validation back
      // try {
      //   validateInvestmentData(selectedType, formData, 'basic')
      // } catch (error: any) {
      //   if (error.errors) {
      //     error.errors.forEach((err: any) => {
      //       newErrors[err.path[0]] = err.message
      //     })
      //   }
      // }
    }
    
    if (step === 3) {
      // Validate lots
      if (!formData.lots || formData.lots.length === 0) {
        newErrors.lots = 'At least one lot is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Choose Investment Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INVESTMENT_TYPES.map(type => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all hover:border-zinc-600 ${
                    selectedType === type.value ? 'border-blue-500 bg-blue-500/10' : ''
                  }`}
                  onClick={() => handleTypeSelection(type.value)}
                >
                  <div className="p-4">
                    <div className="font-medium text-white mb-1">{type.label}</div>
                    <div className="text-sm text-zinc-400">{type.description}</div>
                    {selectedType === type.value && (
                      <span className="text-blue-400 mt-2">✅</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {errors.type && (
              <p className="text-red-400 text-sm">{errors.type}</p>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">
              {INVESTMENT_TYPES.find(t => t.value === selectedType)?.label} Details
            </h3>
            {selectedType && (
              <FieldRenderer
                investmentType={selectedType}
                formData={formData}
                onChange={handleFieldChange}
                errors={errors}
                step="basic"
              />
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Add Purchase Details</h3>
            {selectedType && (
              <div className="space-y-6">
                {/* Entry method selection for applicable types */}
                {['stock', 'etf', 'crypto'].includes(selectedType) && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-300">
                      Entry Method
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: 'single', label: 'Single Purchase' },
                        { value: 'average', label: 'Average Cost' },
                        { value: 'multiple', label: 'Multiple Lots' },
                      ].map(method => (
                        <button
                          key={method.value}
                          onClick={() => handleFieldChange('entryMethod', method.value)}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            formData.entryMethod === method.value
                              ? 'bg-blue-500 text-white'
                              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render appropriate entry form */}
                {formData.entryMethod === 'multiple' ? (
                  <LotsEditor
                    lots={formData.lots || []}
                    onChange={(lots) => handleFieldChange('lots', lots)}
                    symbol={formData.symbol}
                    investmentType={selectedType}
                  />
                ) : (
                  <div className="space-y-4">
                    <FieldRenderer
                      investmentType={selectedType}
                      formData={formData}
                      onChange={handleFieldChange}
                      errors={errors}
                      step="lots"
                    />
                  </div>
                )}

                {errors.lots && (
                  <p className="text-red-400 text-sm">{errors.lots}</p>
                )}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Review & Confirm</h3>
            
            <Card className="p-4">
              <h4 className="font-medium text-white mb-3">Investment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Type:</span>
                  <span className="text-white">{INVESTMENT_TYPES.find(t => t.value === selectedType)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Symbol:</span>
                  <span className="text-white">{formData.symbol || formData.displayName}</span>
                </div>
                {formData.account && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Account:</span>
                    <span className="text-white">{formData.account}</span>
                  </div>
                )}
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tags:</span>
                    <span className="text-white">{formData.tags.join(', ')}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Show lots summary */}
            {formData.lots && formData.lots.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-white mb-3">Purchase Details</h4>
                <div className="space-y-2">
                  {formData.lots.map((lot: Lot, index: number) => (
                    <div key={lot.id || index} className="flex justify-between text-sm">
                      <span className="text-zinc-400">
                        {new Date(lot.date).toLocaleDateString()}: {lot.quantity} @ ${lot.price}
                      </span>
                      <span className="text-white">
                        ${(lot.quantity * lot.price + (lot.fees || 0)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Privacy settings summary */}
            <Card className="p-4">
              <h4 className="font-medium text-white mb-3">Privacy Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className={formData.privacy?.showPosition ? 'text-emerald-400' : 'text-red-400'}>
                    {formData.privacy?.showPosition ? '✓' : '✗'}
                  </span>
                  <span className="text-zinc-300">Show position publicly</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={formData.privacy?.showLots ? 'text-emerald-400' : 'text-red-400'}>
                    {formData.privacy?.showLots ? '✓' : '✗'}
                  </span>
                  <span className="text-zinc-300">Show purchase details</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={formData.privacy?.showPnL ? 'text-emerald-400' : 'text-red-400'}>
                    {formData.privacy?.showPnL ? '✓' : '✗'}
                  </span>
                  <span className="text-zinc-300">Show profit/loss</span>
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
    <>
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">
              {editingId ? 'Edit Investment' : 'Add Investment'}
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
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div key={step}>
            {renderStepContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-700 bg-zinc-800/50">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            ← Back
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => saveDraft(draftId, {
                type: selectedType!,
                step,
                data: formData,
                lastSaved: new Date().toISOString(),
              })}
              className="flex items-center gap-2"
            >
              💾 Save Draft
            </Button>

            {step < 4 ? (
              <Button
                onClick={handleNext}
                disabled={step === 1 && !selectedType}
                className="flex items-center gap-2"
              >
                Next →
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                isLoading={isLoading}
                className="flex items-center gap-2"
              >
                {editingId ? 'Update Investment' : 'Add Investment'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>

    {/* Enhanced Forms */}
    {showEnhancedForm && selectedType === 'stock' && (
      <StockForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleStockSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'etf' && (
      <EtfForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleEtfSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'option' && (
      <OptionForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleOptionSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'crypto' && (
      <CryptoForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleCryptoSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'bond' && (
      <BondForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleBondSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'commodity' && (
      <CommodityForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleCommoditySubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'real_estate' && (
      <RealEstateForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleRealEstateSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'cash' && (
      <CashForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleCashSubmit}
      />
    )}

    {showEnhancedForm && selectedType === 'custom' && (
      <CustomForm
        isOpen={showEnhancedForm}
        onClose={() => setShowEnhancedForm(false)}
        onSubmit={handleCustomSubmit}
      />
    )}
  </>
  )
}
