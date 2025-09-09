import { Link, useLocation } from 'react-router-dom'

const items = [
	{ to: '/', label: 'Hub' },
	{ to: '/social', label: 'Social' },
	{ to: '/mystocks', label: 'Investments' },
	{ to: '/settings', label: 'Settings' },
]

function BottomNav() {
	const { pathname } = useLocation()
	return (
		<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
			<div className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
				{items.map((it) => {
					const active = pathname === it.to
					return (
						<Link key={it.to} to={it.to} className={['p-3', active ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200'].join(' ')}>
							{it.label}
						</Link>
					)
				})}
			</div>
		</nav>
	)
}

export default BottomNav


