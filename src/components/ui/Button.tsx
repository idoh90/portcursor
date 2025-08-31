import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant
	size?: ButtonSize
	isLoading?: boolean
}

const base = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
	primary: 'bg-indigo-500 hover:bg-indigo-400 text-white focus:ring-indigo-400 ring-offset-zinc-900',
	secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 focus:ring-zinc-600 ring-offset-zinc-900',
	ghost: 'bg-transparent hover:bg-zinc-800/60 text-zinc-100 focus:ring-zinc-600 ring-offset-zinc-900',
	danger: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 ring-offset-zinc-900',
}

const sizes: Record<ButtonSize, string> = {
	sm: 'h-8 px-3 text-xs',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-6 text-base',
}

export default function Button({ variant = 'primary', size = 'md', isLoading, className = '', children, type, disabled, ...rest }: PropsWithChildren<ButtonProps>) {
	const isBusy = !!isLoading
	const computedType = type ?? 'button'
	return (
		<button
			type={computedType}
			aria-busy={isBusy || undefined}
			disabled={disabled || isBusy}
			className={[base, variants[variant], sizes[size], className].join(' ')}
			{...rest}
		>
			{isBusy ? (
				<span aria-hidden className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
			) : null}
			{children}
		</button>
	)
}


