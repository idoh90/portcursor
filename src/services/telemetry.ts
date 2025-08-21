type Metric = { name: string; value: number; tags?: Record<string, string> }

export function trackEvent(name: string, props?: Record<string, string | number | boolean>): void {
	console.debug('[telemetry:event]', name, props ?? {})
}

export function trackError(name: string, error: unknown, props?: Record<string, string | number | boolean>): void {
	const message = error instanceof Error ? error.message : String(error)
	console.error('[telemetry:error]', name, message, props ?? {})
}

export function trackMetric(metric: Metric): void {
	console.debug('[telemetry:metric]', metric.name, metric.value, metric.tags ?? {})
}

export async function timeIt<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
	const start = performance.now()
	try {
		const res = await fn()
		trackMetric({ name, value: performance.now() - start, tags })
		return res
	} catch (e) {
		trackMetric({ name: `${name}.error`, value: performance.now() - start, tags })
		throw e
	}
}


