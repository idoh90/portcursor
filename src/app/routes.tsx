import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Suspense } from 'react'
import Hub from '../pages/Hub'
import Social from '../pages/Social'
import MyStocks from '../pages/MyStocks'
import Settings from '../pages/Settings'
import PublicProfile from '../pages/PublicProfile'
import PositionDetail from '../pages/PositionDetail'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Profile from '../pages/Profile'
import Layout from '../components/layout/Layout'

// Loading component
function Loading() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-zinc-400">Loading...</div>
    </div>
  )
}

// Error Boundary component
function ErrorFallback() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-white mb-2">Something went wrong</h1>
        <p className="text-zinc-400 mb-4">Please refresh the page to try again.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}

export default function AppRoutes() {
  try {
    let user
    try {
      user = useAuthStore((s) => s.user)
    } catch (error) {
      console.error('Error accessing auth store:', error)
      user = null
    }
    
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}> 
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={user ? <Hub /> : <Navigate to="/login" replace />} />
            <Route path="/social" element={user ? <Social /> : <Navigate to="/login" replace />} />
            <Route path="/me" element={user ? <MyStocks /> : <Navigate to="/login" replace />} />
            <Route path="/mystocks" element={user ? <MyStocks /> : <Navigate to="/login" replace />} />
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
            <Route path="/u/:handle" element={<PublicProfile />} />
            <Route path="/profile/:name" element={<Profile />} />
            <Route path="/position/:id" element={<PositionDetail />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </Suspense>
    )
  } catch (error) {
    console.error('Error in AppRoutes:', error)
    return <ErrorFallback />
  }
}


