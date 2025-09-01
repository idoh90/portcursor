import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { t } from '../../lib/i18n'

const items = [
  { to: '/', labelKey: 'hub' as const },
  { to: '/social', labelKey: 'social' as const },
  { to: '/me', labelKey: 'myStocks' as const },
  { to: '/settings', labelKey: 'settings' as const },
]

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  
  // Don't show bottom nav on login/register pages
  if (pathname === '/login' || pathname === '/register') {
    return null
  }
  
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
        {items.map((it) => {
          const active = pathname === it.to || (it.to === '/me' && pathname === '/mystocks')
          return (
            <Link key={it.to} to={it.to} className={["p-3", active ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'].join(' ')}>
              {t(it.labelKey)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


