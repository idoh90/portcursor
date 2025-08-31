import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function Input({ className = '', ...rest }: InputProps) {
	return (
		<input
			className={[
				'w-full rounded-md bg-zinc-900 text-zinc-100 placeholder-zinc-500 border border-zinc-800',
				'px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-zinc-700',
				className,
			].join(' ')}
			{...rest}
		/>
	)
}


