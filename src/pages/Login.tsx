import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../stores/authStore'
import { Link, useNavigate } from 'react-router-dom'
import { seedDev, clearDatabase } from '../services/seed'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const DEMO_USERS = [
	{ id: 'u-ido', displayName: 'Ido', description: 'Portfolio with SPY, MSFT, PLTR' },
	{ id: 'u-megi', displayName: 'Megi', description: 'Portfolio with AAPL, NVDA' },
	{ id: 'u-om', displayName: 'Om', description: 'Portfolio with AMZN' },
]

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
		 if (pin && !/^\d+$/.test(pin)) {
			 setLocalError('PIN must be digits only')
			 return
		 }
		 try {
			 await login(id.trim(), pin || '0000')
			 navigate('/')
		 } catch {
			 // error handled in store
		 }
	 }

	 const quickLogin = async (userId: string) => {
		 setLocalError(undefined)
		 try {
			 await login(userId, '0000')
			 navigate('/')
		 } catch (e) {
			 console.error('Quick login failed:', e)
			 setLocalError('User not found. Try clicking "Seed Demo Data" first.')
		 }
	 }

	 const handleSeedData = async () => {
		 setLocalError(undefined)
		 try {
			 console.log('Manually seeding demo data...')
			 await seedDev()
			 setLocalError(undefined)
			 alert('Demo data created successfully! You can now use the quick login options.')
		 } catch (e) {
			 console.error('Failed to seed data:', e)
			 setLocalError('Failed to create demo data. Check console for details.')
		 }
	 }

	 const handleClearAndReseed = async () => {
		 setLocalError(undefined)
		 try {
			 console.log('Clearing database and reseeding...')
			 await clearDatabase()
			 await seedDev()
			 setLocalError(undefined)
			 alert('Database cleared and demo data recreated! You can now use the quick login options.')
		 } catch (e) {
			 console.error('Failed to clear and reseed:', e)
			 setLocalError('Failed to clear and reseed. Check console for details.')
		 }
	 }

	 return (
		 <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
			 <div className="w-full max-w-md space-y-6">
				 {/* Main Login Card */}
				 <Card className="relative overflow-hidden">
					 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
					 <div className="relative">
						 <div className="mb-6 text-center">
							 <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
								 <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
								 </svg>
							 </div>
							 <h1 className="text-2xl font-bold text-white">Welcome back</h1>
							 <p className="mt-2 text-zinc-400">Sign in to your PortfolioHub account</p>
						 </div>
						 
						 <form onSubmit={onSubmit} className="space-y-4">
							 <div className="space-y-2">
								 <label className="text-sm font-medium text-zinc-300">User ID</label>
								 <Input 
									 value={id} 
									 onChange={(e) => setId(e.target.value)} 
									 placeholder="Enter your user ID" 
									 autoFocus 
									 className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500"
								 />
							 </div>
							 <div className="space-y-2">
								 <label className="text-sm font-medium text-zinc-300">PIN</label>
								 <Input 
									 value={pin} 
									 onChange={(e) => setPin(e.target.value)} 
									 placeholder="Enter your PIN (optional for demo)" 
									 inputMode="numeric" 
									 type="password"
									 className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500"
								 />
							 </div>
							 {(localError || error) && (
								 <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3">
									 <div className="text-sm text-red-400">{localError || error}</div>
								 </div>
							 )}
							 <Button 
								 type="submit" 
								 disabled={loading} 
								 className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2.5"
							 >
								 {loading ? 'Signing in...' : 'Sign in'}
							 </Button>
						 </form>
						 
						 <div className="mt-6 text-center">
							 <p className="text-sm text-zinc-500">
								 Don't have an account? <Link className="text-blue-400 hover:text-blue-300 underline" to="/register">Create one</Link>
							 </p>
						 </div>
					 </div>
				 </Card>

				 {/* Development Quick Login */}
				 <Card className="border-amber-500/20 bg-amber-500/5">
					 <div className="mb-4">
						 <div className="flex items-center gap-2 mb-2">
							 <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							 </svg>
							 <h3 className="text-sm font-semibold text-amber-400">Development Mode</h3>
						 </div>
						 <p className="text-xs text-amber-300/80 mb-4">Quick login options for testing and development</p>
					 </div>
					 
					 <div className="space-y-2">
						 {DEMO_USERS.map((user) => (
							 <button
								 key={user.id}
								 onClick={() => quickLogin(user.id)}
								 disabled={loading}
								 className="w-full text-left p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 hover:border-zinc-600 transition-colors group disabled:opacity-50"
							 >
								 <div className="flex items-center justify-between">
									 <div>
										 <div className="font-medium text-zinc-200 group-hover:text-white">{user.displayName}</div>
										 <div className="text-xs text-zinc-400">{user.description}</div>
										 <div className="text-xs text-zinc-500 mt-1">ID: {user.id}</div>
									 </div>
									 <svg className="h-4 w-4 text-zinc-400 group-hover:text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									 </svg>
								 </div>
							 </button>
						 ))}
					 </div>
					 
					 <div className="mt-4 space-y-3">
						 <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
							 <p className="text-xs text-zinc-500">
								 💡 <strong>Tip:</strong> These demo accounts have pre-loaded portfolios and positions for testing the app features.
							 </p>
						 </div>
						 
						 <div className="space-y-2">
							 <button
								 onClick={handleSeedData}
								 className="w-full p-2 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
							 >
								 🔧 Seed Demo Data
							 </button>
							 <button
								 onClick={handleClearAndReseed}
								 className="w-full p-2 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
							 >
								 🗑️ Clear & Reseed (If having issues)
							 </button>
						 </div>
					 </div>
				 </Card>
			 </div>
		 </div>
	 )
}

export default Login


