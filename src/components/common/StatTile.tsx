import type { HTMLAttributes } from 'react'

interface StatTileProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value?: string
  subvalue?: string
  loading?: boolean
  error?: string
}

export default function StatTile({ label, value, subvalue, loading, error, className = '', ...rest }: StatTileProps) {
  return (
    <div className={["rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 min-w-[9rem]", className].join(' ')} {...rest}>
      <div className="text-xs text-zinc-400">{label}</div>
      {loading ? (
        <div className="mt-1 h-6 w-24 animate-pulse rounded bg-zinc-800" />
      ) : error ? (
        <div className="mt-1 text-sm text-red-400">{error}</div>
      ) : (
        <div className="mt-1 text-lg font-semibold">{value ?? '—'}</div>
      )}
      {subvalue ? <div className="text-xs text-zinc-500 mt-0.5">{subvalue}</div> : null}
    </div>
  )
}


