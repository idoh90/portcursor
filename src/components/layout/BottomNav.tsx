import { Link, useLocation } from 'react-router-dom'

const items = [
	{ to: '/', label: 'Hub' },
	{ to: '/social', label: 'Social' },
	{ to: '/mystocks', label: 'My Stocks' },
	{ to: '/settings', label: 'Settings' },
]

function BottomNav() {
	const { pathname } = useLocation()
	return (
		<nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur">
			<ul className="mx-auto grid max-w-md grid-cols-4 text-center text-xs">
				{items.map((it) => {
					const active = pathname === it.to
					return (
						<li key={it.to}>
							<Link
								to={it.to}
								aria-current={active ? 'page' : undefined}
								className={[
									'p-3',
									active ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-200',
								].join(' ')}
							>
								{it.label}
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}

export default BottomNav


