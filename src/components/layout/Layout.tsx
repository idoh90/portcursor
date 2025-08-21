import { Outlet, Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

function Layout() {
	const { user, logout } = useAuthStore()
	return (
		<div className="min-h-dvh bg-white text-gray-900">
			<header className="mx-auto max-w-md p-4 flex items-center justify-between">
				<Link to="/" className="font-medium">PortfolioHub</Link>
				<div className="text-sm">
					{user ? (
						<div className="flex items-center gap-2">
							<Link className="underline" to={`/profile/${user.displayName}`}>{user.displayName}</Link>
							<button onClick={logout} className="rounded border px-2 py-1">Logout</button>
						</div>
					) : (
						<Link className="underline" to="/login">Login</Link>
					)}
				</div>
			</header>
			<main className="mx-auto max-w-md p-4">
				<Outlet />
			</main>
			<nav className="fixed inset-x-0 bottom-0 border-t bg-white">
				<div className="mx-auto grid max-w-md grid-cols-4 text-center text-sm">
					<Link to="/" className="p-3">Hub</Link>
					<Link to="/social" className="p-3">Social</Link>
					<Link to="/mystocks" className="p-3">My Stocks</Link>
					<Link to="/settings" className="p-3">Settings</Link>
				</div>
			</nav>
		</div>
	)
}

export default Layout


