// Guarded SW registration; only enable in production builds where a service worker is present
export function registerServiceWorker() {
	if (import.meta.env.PROD && 'serviceWorker' in navigator) {
		// Lazy import to avoid bundling workbox in dev
		import('workbox-window').then(({ Workbox }) => {
			const wb = new Workbox('/sw.js', { scope: '/' })
			wb.addEventListener('waiting', () => {
				wb.messageSkipWaiting()
			})
			wb.register()
		}).catch(() => {
			// ignore in environments without workbox
		})
	}
	// In dev, aggressively unregister any existing SWs that could be interfering
	if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
		navigator.serviceWorker.getRegistrations?.().then((regs) => {
			regs.forEach((r) => r.unregister().catch(() => {}))
		}).catch(() => {})
	}
}


