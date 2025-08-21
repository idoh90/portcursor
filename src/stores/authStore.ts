import { create } from 'zustand'
import { login as authLogin, register as authRegister, type AuthUser, type RegisterInput } from '../services/auth'

type AuthState = {
	 user?: AuthUser
	 loading: boolean
	 error?: string
	 login: (id: string, pin: string) => Promise<void>
	 register: (input: RegisterInput) => Promise<void>
	 logout: () => void
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
	 }
}))


