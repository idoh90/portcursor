import { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { motion } from 'framer-motion'
import InvestmentCard from './InvestmentCard'
import type { Investment } from '../../features/investments/types'
import type { PriceQuote } from '../../models/types'

interface VirtualizedInvestmentListProps {
  investments: Investment[]
  quotes: Map<string, PriceQuote>
  height?: number
  itemHeight?: number
  selectionMode?: boolean
  selectedInvestments?: string[]
  onSelectionChange?: (investmentId: string, selected: boolean) => void
  onInvestmentClick?: (investment: Investment) => void
}

interface ListItemProps {
  index: number
  style: React.CSSProperties
  data: {
    investments: Investment[]
    quotes: Map<string, PriceQuote>
    selectionMode: boolean
    selectedInvestments: string[]
    onSelectionChange?: (investmentId: string, selected: boolean) => void
    onInvestmentClick?: (investment: Investment) => void
  }
}

const ListItem = ({ index, style, data }: ListItemProps) => {
  const {
    investments,
    quotes,
    selectionMode,
    selectedInvestments,
    onSelectionChange,
    onInvestmentClick
  } = data

  const investment = investments[index]
  if (!investment) return null

  const isSelected = selectedInvestments.includes(investment.id)

  return (
    <div style={style}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
        className="px-4 pb-2"
      >
        <div className="relative">
          {selectionMode && (
            <div className="absolute top-4 left-4 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectionChange?.(investment.id, e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-zinc-700 border-zinc-600 rounded focus:ring-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <InvestmentCard
            investment={investment}
            quote={quotes.get(investment.symbol)}
            onClick={() => onInvestmentClick?.(investment)}
          />
        </div>
      </motion.div>
    </div>
  )
}

export default function VirtualizedInvestmentList({
  investments,
  quotes,
  height = 600,
  itemHeight = 120,
  selectionMode = false,
  selectedInvestments = [],
  onSelectionChange,
  onInvestmentClick
}: VirtualizedInvestmentListProps) {
  const itemData = useMemo(() => ({
    investments,
    quotes,
    selectionMode,
    selectedInvestments,
    onSelectionChange,
    onInvestmentClick
  }), [investments, quotes, selectionMode, selectedInvestments, onSelectionChange, onInvestmentClick])

  if (investments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-400">
        No investments to display
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height }}>
      <List
        height={height}
        itemCount={investments.length}
        itemSize={itemHeight}
        itemData={itemData}
        overscanCount={5}
        className="scrollbar-thin scrollbar-track-zinc-800 scrollbar-thumb-zinc-600"
      >
        {ListItem}
      </List>
    </div>
  )
}
