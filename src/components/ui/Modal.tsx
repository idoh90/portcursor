import React, { useEffect } from 'react'

export interface ModalProps {
	open: boolean
	onClose: () => void
	title?: string
	children?: React.ReactNode
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
	useEffect(() => {
		if (!open) return
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handler)
		return () => document.removeEventListener('keydown', handler)
	}, [open, onClose])

	if (!open) return null
	return (
		<div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
			<button
				aria-label="Close"
				onClick={onClose}
				className="absolute inset-0 bg-black/70"
			/>
			<div className="absolute inset-x-4 top-20 mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl focus:outline-none">
				{title ? <div className="mb-2 text-sm font-medium text-zinc-200">{title}</div> : null}
				{children}
			</div>
		</div>
	)
}


