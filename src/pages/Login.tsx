import { FormEvent, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'

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
		 <div className="space-y-4">
			 <h1 className="text-xl font-semibold">Login</h1>
			 <form onSubmit={onSubmit} className="space-y-3">
				 <div className="space-y-1">
					 <label className="text-sm text-gray-600">User ID</label>
					 <input value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="e.g. phone or unique id" />
				 </div>
				 <div className="space-y-1">
					 <label className="text-sm text-gray-600">PIN</label>
					 <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="4-12 digits" inputMode="numeric" />
				 </div>
				 {(localError || error) && <div className="text-sm text-red-600">{localError || error}</div>}
				 <button type="submit" disabled={loading} className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60">{loading ? 'Signing in...' : 'Sign in'}</button>
			 </form>
			 <div className="text-sm text-gray-600">No account? <Link className="underline" to="/register">Create one</Link></div>
		 </div>
	 )
}

export default Login


