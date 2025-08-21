import { FormEvent, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { validateDisplayName, validatePin } from '../services/auth'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

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
		 <div className="ph-container flex min-h-[70dvh] items-center justify-center">
			 <Card className="w-full max-w-sm">
				 <div className="mb-4 text-center">
					 <h1 className="text-xl font-semibold tracking-tight">Create account</h1>
					 <p className="mt-1 text-sm text-zinc-400">Join PortfolioHub</p>
				 </div>
				 <form onSubmit={onSubmit} className="space-y-3">
					 <div className="space-y-1">
						 <label className="text-xs text-zinc-400">User ID</label>
						 <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="your unique id" />
					 </div>
					 <div className="space-y-1">
						 <label className="text-xs text-zinc-400">Display name</label>
						 <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="letters, numbers, _ . -" />
					 </div>
					 <div className="space-y-1">
						 <label className="text-xs text-zinc-400">PIN</label>
						 <Input value={pin} onChange={(e) => setPin(e.target.value)} placeholder="4-12 digits" inputMode="numeric" type="password" />
					 </div>
					 {(localError || error) && <div className="text-sm text-red-400">{localError || error}</div>}
					 <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating...' : 'Create account'}</Button>
				 </form>
				 <div className="mt-4 text-center text-xs text-zinc-500">Already have an account? <Link className="underline" to="/login">Sign in</Link></div>
			 </Card>
		 </div>
	 )
}

export default Register


