import React from 'react'

export default function Skeleton({ className = '' }: { className?: string }) {
	return <div className={["animate-pulse rounded-md bg-zinc-800/80", className].join(' ')} />
}

export function SkeletonText({ rows = 1 }: { rows?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="h-3 w-full animate-pulse rounded bg-zinc-800/80" />
			))}
		</div>
	)
}



