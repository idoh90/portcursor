interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export default function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-4">
      <div className="text-sm font-medium text-red-300">{title}</div>
      {message ? <div className="mt-1 text-xs text-red-400">{message}</div> : null}
      {onRetry ? (
        <button className="mt-3 h-8 rounded-md bg-red-600 px-3 text-xs text-white hover:bg-red-500" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  )
}


