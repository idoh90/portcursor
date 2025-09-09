import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface CsvImporterProps {
  isOpen: boolean
  onClose: () => void
  investmentType?: string
}

export default function CsvImporter({ isOpen, onClose }: CsvImporterProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-white mb-4">CSV Import</h2>
        <p className="text-zinc-400 mb-6">
          CSV import functionality coming soon!
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  )
}