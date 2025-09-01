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
						<Link 
							to="/login" 
							className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-md transition-all duration-200 hover:scale-105"
						>
							<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
							</svg>
							Login
						</Link>
					)}
				</div>
			</div>
		</header>
	)
}

export default Header


