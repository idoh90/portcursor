interface Props { name: string; size?: number }

export default function AvatarCircle({ name, size = 36 }: Props) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('') || 'U'
  const style: React.CSSProperties = { width: size, height: size }
  return (
    <div className="flex items-center justify-center rounded-full bg-zinc-800 text-zinc-200" style={style} aria-label={name}>
      <span className="text-xs font-semibold">{initials}</span>
    </div>
  )
}


