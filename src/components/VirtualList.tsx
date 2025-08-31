import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

type Props<T> = {
	items: T[]
	rowHeight: number
	height: number
	renderRow: (item: T, index: number) => ReactNode
}

export default function VirtualList<T>({ items, rowHeight, height, renderRow }: Props<T>) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [scrollTop, setScrollTop] = useState(0)
	useEffect(() => {
		const el = containerRef.current
		if (!el) return
		const onScroll = () => setScrollTop(el.scrollTop)
		el.addEventListener('scroll', onScroll)
		return () => el.removeEventListener('scroll', onScroll)
	}, [])
	const total = items.length * rowHeight
	const start = Math.max(0, Math.floor(scrollTop / rowHeight) - 5)
	const end = Math.min(items.length, Math.ceil((scrollTop + height) / rowHeight) + 5)
	const slice = useMemo(() => items.slice(start, end), [items, start, end])
	return (
		<div ref={containerRef} style={{ height, overflowY: 'auto', position: 'relative' }}>
			<div style={{ height: total }} />
			<div style={{ position: 'absolute', top: start * rowHeight, left: 0, right: 0 }}>
				{slice.map((item, i) => (
					<div key={start + i} style={{ height: rowHeight }}>
						{renderRow(item, start + i)}
					</div>
				))}
			</div>
		</div>
	)
}


