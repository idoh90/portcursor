const defaults = {
	pricingDbCache: true,
	virtualList: true,
	sparklines: true,
	telemetry: true,
}

type Flags = typeof defaults

let overrides: Partial<Flags> = {}

export function setFlags(next: Partial<Flags>) {
	overrides = { ...overrides, ...next }
}

export function flag<K extends keyof Flags>(key: K): boolean {
	return (overrides[key] ?? defaults[key]) as boolean
}


