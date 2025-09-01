import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import { useEffect, useState } from 'react'
import { setLocale } from '../lib/i18n'
import { useSettingsStore } from '../features/settings/store'
import { seedDev } from '../services/seed'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { setQuoteProvider } from '../services/pricing/priceService'
import { unifiedQuote } from '../services/pricing/providers/unifiedProvider'

// Simple error boundary for debugging
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (hasError) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Application Error</h1>
          <p className="text-zinc-400 mb-4">Something went wrong. Check the console for details.</p>
          <button 
            onClick={() => { setHasError(false); window.location.reload() }} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

export default function App() {
  try {
    const locale = useSettingsStore(s => s.locale)
    
    useEffect(() => { 
      try {
        setLocale(locale) 
      } catch (error) {
        console.error('Error setting locale:', error)
      }
    }, [locale])
    
    useEffect(() => {
      const initialize = async () => {
        try {
          // Initialize quote provider
          setQuoteProvider(unifiedQuote)
          // Seed demo data - wait for it to complete
          console.log('Initializing demo data...')
          await seedDev()
          console.log('Demo data initialized successfully')
        } catch (error) {
          console.error('Error in initialization:', error)
        }
      }
      initialize()
    }, [])
    
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    })
    
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    )
  } catch (error) {
    console.error('Error in App component:', error)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">App Failed to Load</h1>
          <p className="text-zinc-400 mb-4">Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }
}


