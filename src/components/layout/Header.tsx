import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import Button from '../ui/Button'
import OfflineBanner from './OfflineBanner'

function Header() {
	const { user, logout } = useAuthStore()
	return (
		<header className="sticky top-0 z-40 mx-auto w-full max-w-md border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
			<OfflineBanner />
			<div className="flex items-center justify-between px-4 py-3">
				<Link to="/" className="text-sm font-semibold tracking-tight">
					PortfolioHub
				</Link>
				<div className="text-xs">
					{user ? (
						<div className="flex items-center gap-2">
							<Link className="underline" to={`/profile/${user.displayName}`}>{user.displayName}</Link>
							<Button variant="secondary" size="sm" onClick={logout}>Logout</Button>
						</div>
					) : (
						<Link className="underline" to="/login">Login</Link>
					)}
				</div>
			</div>
		</header>
	)
}

export default Header


