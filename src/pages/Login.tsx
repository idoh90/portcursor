import { FormEvent, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

function Login() {
	 const [id, setId] = useState('')
	 const [pin, setPin] = useState('')
	 const [localError, setLocalError] = useState<string | undefined>()
	 const navigate = useNavigate()
	 const { login, loading, error } = useAuthStore()

	 const onSubmit = async (e: FormEvent) => {
		 e.preventDefault()
		 setLocalError(undefined)
		 if (!id.trim()) {
			 setLocalError('User ID is required')
			 return
		 }
		 if (!/^\d+$/.test(pin)) {
			 setLocalError('PIN must be digits only')
			 return
		 }
		 try {
			 await login(id.trim(), pin)
			 navigate('/')
		 } catch {
			 // error handled in store
		 }
	 }

	 return (
		 <div className="ph-container flex min-h-[70dvh] items-center justify-center">
			 <Card className="w-full max-w-sm">
				 <div className="mb-4 text-center">
					 <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
					 <p className="mt-1 text-sm text-zinc-400">Sign in to PortfolioHub</p>
				 </div>
				 <form onSubmit={onSubmit} className="space-y-3">
					 <div className="space-y-1">
						 <label className="text-xs text-zinc-400">User ID</label>
						 <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. phone or unique id" autoFocus />
					 </div>
					 <div className="space-y-1">
						 <label className="text-xs text-zinc-400">PIN</label>
						 <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-12 digits" inputMode="numeric" type="password" />
					 </div>
					 {(localError || error) && <div className="text-sm text-red-400">{localError || error}</div>}
					 <Button type="submit" disabled={loading} className="w-full">{loading ? 'Signing in...' : 'Sign in'}</Button>
				 </form>
				 <div className="mt-4 text-center text-xs text-zinc-500">No account? <Link className="underline" to="/register">Create one</Link></div>
			 </Card>
		 </div>
	 )
}

export default Login


