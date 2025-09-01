interface SkeletonListProps {
  rows?: number
  rounded?: 'md' | 'xl' | '2xl'
  height?: number
}

export default function SkeletonList({ rows = 5, rounded = 'xl', height = 64 }: SkeletonListProps) {
  const r = rounded === '2xl' ? 'rounded-2xl' : rounded === 'xl' ? 'rounded-xl' : 'rounded-md'
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`w-full ${r} border border-zinc-800 bg-zinc-900/50`} style={{ height }} />
      ))}
    </div>
  )
}


