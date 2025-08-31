import { useEffect, useId, useRef } from 'react'

export interface ModalProps {
	open: boolean
	onClose: () => void
	title?: string
	children?: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
	const titleId = useId()
	const dialogRef = useRef<HTMLDivElement>(null)
	const firstFocusRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (!open) return
		const previousActive = document.activeElement as HTMLElement | null
		// Focus the dialog or first focusable
		const t = window.setTimeout(() => {
			(firstFocusRef.current ?? dialogRef.current)?.focus()
		}, 0)
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				e.preventDefault()
				onClose()
			}
		}
		document.addEventListener('keydown', onKeyDown)
		return () => {
			window.clearTimeout(t)
			document.removeEventListener('keydown', onKeyDown)
			previousActive?.focus?.()
		}
	}, [open])

	if (!open) return null
	return (
		<div className="fixed inset-0 z-50">
			<button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
			<div
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={title ? titleId : undefined}
				tabIndex={-1}
				className="absolute inset-x-4 top-20 mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl"
			>
				{title ? (
					<div id={titleId} className="mb-2 text-sm font-medium text-zinc-200">
						{title}
					</div>
				) : null}
				{children}
				<div className="mt-3 flex justify-end">
					<button ref={firstFocusRef} className="sr-only" aria-hidden>
						close
					</button>
				</div>
			</div>
		</div>
	)
}


