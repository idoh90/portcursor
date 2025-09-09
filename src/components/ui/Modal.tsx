import React from 'react'

export interface ModalProps {
	isOpen?: boolean
	open?: boolean
	onClose: () => void
	title?: string
	children?: React.ReactNode
}

export default function Modal({ isOpen, open, onClose, title, children }: ModalProps) {
	const isVisible = isOpen ?? open
	if (!isVisible) return null
	return (
		<div className="fixed inset-0 z-50">
			<button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/70" />
			<div className="absolute inset-x-4 top-20 mx-auto max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-xl">
				{title ? <div className="mb-2 text-sm font-medium text-zinc-200">{title}</div> : null}
				{children}
			</div>
		</div>
	)
}


