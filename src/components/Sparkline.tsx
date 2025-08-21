import { useEffect, useMemo, useState } from 'react'
import { getSparkline } from '../services/pricing/sparklineService'

type Props = {
	symbol: string
	windowDays?: 7 | 30
	width?: number
	height?: number
}

export default function Sparkline({ symbol, windowDays = 7, width = 80, height = 24 }: Props) {
	const [data, setData] = useState<number[] | undefined>(undefined)
	useEffect(() => {
		let cancelled = false
		getSparkline(symbol, windowDays).then((values) => {
			if (!cancelled) setData(values)
		})
		return () => { cancelled = true }
	}, [symbol, windowDays])

	const path = useMemo(() => {
		if (!data || data.length === 0) return ''
		const min = Math.min(...data)
		const max = Math.max(...data)
		const range = max - min || 1
		const stepX = width / (data.length - 1 || 1)
		return data
			.map((v, i) => {
				const x = i * stepX
				const y = height - ((v - min) / range) * height
				return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
			})
			.join(' ')
	}, [data, width, height])

	return (
		<svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-label={`${symbol} sparkline`}>
			<path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} />
		</svg>
	)
}


