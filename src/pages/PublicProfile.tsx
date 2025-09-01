import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import EmptyState from '../components/common/EmptyState'
import Card from '../components/ui/Card'
import { db } from '../services/db'

export default function PublicProfile() {
  const { handle } = useParams()
  const [user, setUser] = useState<{ id: string; displayName: string } | null>(null)
  const [positions, setPositions] = useState<Array<{ id: string; symbol: string }>>([])
  useEffect(() => {
    let mounted = true
    db.users.toArray().then(arr => {
      const u = arr.find(x => x.displayName?.toLowerCase?.() === handle?.toLowerCase()) || null
      if (!mounted) return
      setUser(u as any)
      if (!u) return
      db.portfolios.where('userId').equals(u.id).toArray().then(async (pfs) => {
        const pf = pfs[0]
        if (!pf) return
        const ps = await db.positions.where('portfolioId').equals(pf.id).toArray()
        setPositions(ps.map(p => ({ id: p.id, symbol: p.symbol })))
      })
    })
    return () => { mounted = false }
  }, [handle])
  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-xl font-semibold">@{handle}</h1>
      {!user ? (
        <EmptyState title="User not found" />
      ) : positions.length === 0 ? (
        <Card className="text-sm text-zinc-500">No public positions</Card>
      ) : (
        <Card head="Positions">
          <div className="grid grid-cols-2 gap-2">
            {positions.map(p => (
              <div key={p.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-sm">{p.symbol}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}


