import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './components/layout/Layout'
import Hub from './pages/Hub'
import Social from './pages/Social'
import MyStocks from './pages/MyStocks'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuthStore } from './stores/authStore'

function App() {
	const user = useAuthStore((s) => s.user)
	return (
		<BrowserRouter>
			<Routes>
				<Route element={<Layout />}> 
					<Route path="/" element={user ? <Hub /> : <Navigate to="/login" replace />} />
					<Route path="/social" element={user ? <Social /> : <Navigate to="/login" replace />} />
					<Route path="/mystocks" element={user ? <MyStocks /> : <Navigate to="/login" replace />} />
					<Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" replace />} />
					<Route path="/profile/:name" element={<Profile />} />
					<Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
					<Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Routes>
		</BrowserRouter>
	)
}

export default App
