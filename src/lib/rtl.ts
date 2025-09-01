export function isRtl(): boolean { return document?.documentElement?.dir === 'rtl' }
export function mx(start: string, end: string): string { return isRtl() ? end : start }
export function ml(value: string): string { return isRtl() ? 'mr-' + value : 'ml-' + value }
export function mr(value: string): string { return isRtl() ? 'ml-' + value : 'mr-' + value }


