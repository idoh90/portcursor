import { FormEvent, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { validateDisplayName, validatePin } from '../services/auth'

function Register() {
	 const [id, setId] = useState('')
	 const [displayName, setDisplayName] = useState('')
	 const [pin, setPin] = useState('')
	 const [localError, setLocalError] = useState<string | undefined>()
	 const navigate = useNavigate()
	 const { register, loading, error } = useAuthStore()

	 const onSubmit = async (e: FormEvent) => {
		 e.preventDefault()
		 setLocalError(undefined)
		 if (!id.trim()) {
			 setLocalError('User ID is required')
			 return
		 }
		 const dnErr = validateDisplayName(displayName)
		 if (dnErr) {
			 setLocalError(dnErr)
			 return
		 }
		 const pinErr = validatePin(pin)
		 if (pinErr) {
			 setLocalError(pinErr)
			 return
		 }
		 try {
			 await register({ id: id.trim(), displayName: displayName.trim(), pin })
			 navigate('/')
		 } catch {
			 // error set in store
		 }
	 }

	 return (
		 <div className="space-y-4">
			 <h1 className="text-xl font-semibold">Create Account</h1>
			 <form onSubmit={onSubmit} className="space-y-3">
				 <div className="space-y-1">
					 <label className="text-sm text-gray-600">User ID</label>
					 <input value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="your unique id" />
				 </div>
				 <div className="space-y-1">
					 <label className="text-sm text-gray-600">Display name</label>
					 <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="letters, numbers, _" />
				 </div>
				 <div className="space-y-1">
					 <label className="text-sm text-gray-600">PIN</label>
					 <input value={pin} onChange={(e) => setPin(e.target.value)} className="w-full rounded border px-3 py-2" placeholder="4-12 digits" inputMode="numeric" />
				 </div>
				 {(localError || error) && <div className="text-sm text-red-600">{localError || error}</div>}
				 <button type="submit" disabled={loading} className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60">{loading ? 'Creating...' : 'Create account'}</button>
			 </form>
			 <div className="text-sm text-gray-600">Already have an account? <Link className="underline" to="/login">Sign in</Link></div>
		 </div>
	 )
}

export default Register


