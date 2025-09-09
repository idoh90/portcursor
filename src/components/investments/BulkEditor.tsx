import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface BulkEditorProps {
  isOpen: boolean
  onClose: () => void
  selectedInvestments: string[]
}

export default function BulkEditor({ isOpen, onClose, selectedInvestments }: BulkEditorProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="bg-zinc-900 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Bulk Edit ({selectedInvestments.length} items)
        </h2>
        <p className="text-zinc-400 mb-6">
          Bulk editing functionality coming soon!
        </p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  )
}