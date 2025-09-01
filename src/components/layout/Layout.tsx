import { Outlet } from 'react-router-dom'
import Header from './Header'
import BottomTabBar from '../nav/BottomTabBar'

function Layout() {
	return (
		<div className="min-h-dvh bg-zinc-950 text-zinc-100">
			<Header />
			<main className="mx-auto max-w-md px-4 pb-24 pt-4">
				<Outlet />
			</main>
			<BottomTabBar />
		</div>
	)
}

export default Layout


