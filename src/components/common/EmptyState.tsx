interface EmptyStateProps {
  title: string
  body?: string
  cta?: React.ReactNode
}

export default function EmptyState({ title, body, cta }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
      <div className="text-base font-medium">{title}</div>
      {body ? <div className="mt-1 text-sm text-zinc-400">{body}</div> : null}
      {cta ? <div className="mt-3">{cta}</div> : null}
    </div>
  )
}


