import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import { listFeed } from '../../services/repos/socialRepo'
import { Link } from 'react-router-dom'

export default function FeedPreview() {
  const [rows, setRows] = useState<Array<{ id: string; summary: string }>>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { listFeed(5).then(res => { setRows(res.items.map(i => ({ id: i.id, summary: i.summary }))); setLoading(false) }) }, [])
  return (
    <Card head="Latest posts">
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="h-10 rounded-md bg-zinc-900/60" />))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-zinc-500">No posts yet</div>
      ) : (
        <div className="space-y-2 text-sm">
          {rows.map(r => (<div key={r.id} className="truncate text-zinc-200">{r.summary}</div>))}
          <Link to="/social" className="text-xs text-indigo-400 underline">See all</Link>
        </div>
      )}
    </Card>
  )
}


