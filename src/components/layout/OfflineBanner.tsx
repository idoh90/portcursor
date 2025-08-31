import { useEffect, useState } from 'react'

export default function OfflineBanner() {
	const [offline, setOffline] = useState(!navigator.onLine)
	useEffect(() => {
		const on = () => setOffline(false)
		const off = () => setOffline(true)
		window.addEventListener('online', on)
		window.addEventListener('offline', off)
		return () => {
			window.removeEventListener('online', on)
			window.removeEventListener('offline', off)
		}
	}, [])
	if (!offline) return null
	return (
		<div role="status" aria-live="polite" className="sticky top-0 z-50 w-full bg-amber-900/70 px-4 py-2 text-center text-xs text-amber-200">
			You are offline. Showing last known data.
		</div>
	)
}


