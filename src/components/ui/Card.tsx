import type { HTMLAttributes, PropsWithChildren } from 'react'
import React from 'react'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
	head?: React.ReactNode
	subhead?: React.ReactNode
}

export default function Card({ head, subhead, className = '', children, ...rest }: PropsWithChildren<CardProps>) {
	return (
		<div className={["rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur", className].join(' ')} {...rest}>
			{head ? (
				<div className="px-4 pt-3">
					<div className="text-sm font-medium text-zinc-200">{head}</div>
					{subhead ? <div className="text-xs text-zinc-400 mt-0.5">{subhead}</div> : null}
				</div>
			) : null}
			<div className={head ? 'p-4 pt-2' : 'p-4'}>
				{children}
			</div>
		</div>
	)
}


