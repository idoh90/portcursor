import { useEffect, useState } from 'react'
import { db } from '../../services/db'
import AvatarCircle from '../common/AvatarCircle'
import { Link } from 'react-router-dom'

function toHandle(displayName: string): string { return displayName.trim().toLowerCase().replace(/\s+/g, '') }

export default function FriendsStrip() {
  const [users, setUsers] = useState<Array<{ id: string; displayName: string }>>([])
  useEffect(() => { db.users.toArray().then(arr => setUsers(arr.map(u => ({ id: u.id, displayName: u.displayName })))) }, [])
  if (users.length === 0) return null
  return (
    <div className="flex gap-3 overflow-x-auto">
      {users.map(u => (
        <Link key={u.id} to={`/u/${toHandle(u.displayName)}`} className="flex w-[72px] flex-col items-center gap-1">
          <AvatarCircle name={u.displayName} />
          <div className="truncate text-center text-xs text-zinc-300">{u.displayName}</div>
        </Link>
      ))}
    </div>
  )
}


