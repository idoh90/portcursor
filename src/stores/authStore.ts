import { create } from 'zustand'
import { login as authLogin, register as authRegister, updateDisplayName as svcUpdateDisplayName, changePin as svcChangePin, revokeAllSessions, type AuthUser, type RegisterInput } from '../services/auth'

type AuthState = {
	user?: AuthUser
	loading: boolean
	error?: string
	login: (id: string, pin: string) => Promise<void>
	register: (input: RegisterInput) => Promise<void>
	logout: () => void
	updateDisplayName: (displayName: string) => Promise<void>
	changePin: (oldPin: string, newPin: string, confirmPin: string) => Promise<void>
	logoutAllDevices: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
	user: undefined,
	loading: false,
	error: undefined,
	async login(id, pin) {
		set({ loading: true, error: undefined })
		try {
			const u = await authLogin(id, pin)
			set({ user: u, loading: false })
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Login failed'
			set({ error: message, loading: false })
			throw e
		}
	},
	async register(input) {
		set({ loading: true, error: undefined })
		try {
			const u = await authRegister(input)
			set({ user: u, loading: false })
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Registration failed'
			set({ error: message, loading: false })
			throw e
		}
	},
	logout() {
		set({ user: undefined })
	},
	async updateDisplayName(displayName) {
		set({ loading: true, error: undefined })
		try {
			const current = (await new Promise<AuthUser | undefined>((r) => r((useAuthStore.getState().user))))
			if (!current) throw new Error('Not authenticated')
			await svcUpdateDisplayName(current.id, displayName)
			set({ user: { ...current, displayName }, loading: false })
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to update display name'
			set({ error: message, loading: false })
			throw e
		}
	},
	async changePin(oldPin, newPin, confirmPin) {
		if (newPin !== confirmPin) {
			const message = 'New PIN and confirmation do not match'
			set({ error: message })
			throw new Error(message)
		}
		set({ loading: true, error: undefined })
		try {
			const current = (await new Promise<AuthUser | undefined>((r) => r((useAuthStore.getState().user))))
			if (!current) throw new Error('Not authenticated')
			await svcChangePin(current.id, oldPin, newPin)
			set({ loading: false })
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to change PIN'
			set({ error: message, loading: false })
			throw e
		}
	},
	async logoutAllDevices() {
		set({ loading: true, error: undefined })
		try {
			const current = (await new Promise<AuthUser | undefined>((r) => r((useAuthStore.getState().user))))
			if (!current) throw new Error('Not authenticated')
			await revokeAllSessions(current.id)
			// Best-effort: also clear local session
			set({ user: undefined, loading: false })
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Failed to logout all devices'
			set({ error: message, loading: false })
			throw e
		}
	}
}))


