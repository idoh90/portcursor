interface Props {
  id: string
  symbol?: string
  summary: string
  likes: number
  onLike?: (postId: string) => void
}

export default function PostCard({ id, symbol, summary, likes, onLike }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="flex items-center justify-between text-sm">
        <div className="font-medium text-zinc-200">{symbol ?? 'Post'}</div>
        <button className="text-xs text-indigo-400" onClick={() => onLike?.(id)}>♥ {likes}</button>
      </div>
      <div className="pt-1 text-sm text-zinc-300">{summary}</div>
    </div>
  )
}


