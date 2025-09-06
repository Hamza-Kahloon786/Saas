// frontend/src/components/layout/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Sidebar from './Sidebar'
import Header from './Header'
import Footer from './Footer'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface Breadcrumb {
  name: string
  href?: string
  current: boolean
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()
  const { user } = useAuthStore()

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Check for system health
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      // Call the non-versioned root API for health
      const response = await api.get('/health', {
        baseURL: (import.meta as any).env.VITE_API_ROOT || 'http://localhost:8000',
      })
      return response.data
    },
    refetchInterval: 60_000,
    retry: 1,
  })

  // Generate breadcrumbs based on current route
  const generateBreadcrumbs = (): Breadcrumb[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const breadcrumbs: Breadcrumb[] = [
      { name: 'Dashboard', href: '/dashboard', current: false }
    ]

    if (pathSegments.length === 1 && pathSegments[0] === 'dashboard') {
      breadcrumbs[0].current = true
      return breadcrumbs
    }

    // Map route segments to readable names
    const segmentNames: Record<string, string> = {
      'crm': 'CRM',
      'contacts': 'Contacts',
      'leads': 'Leads',
      'pipeline': 'Pipeline',
      'scheduling': 'Scheduling',
      'calendar': 'Calendar',
      'job-scheduler': 'Job Scheduler',
      'route-optimization': 'Route Optimization',
      'field-service': 'Field Service',
      'jobs': 'Jobs',
      'technicians': 'Technicians',
      'gps-tracking': 'GPS Tracking',
      'mobile-workflow': 'Mobile Workflow',
      'estimates': 'Estimates',
      'builder': 'Builder',
      'invoice-generator': 'Invoice Generator',
      'ai-automation': 'AI Automation',
      'flows': 'Flows',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'settings': 'Settings',
      'profile': 'Profile',
      'company': 'Company',
      'users': 'Users',
      'integrations': 'Integrations',
      'notifications': 'Notifications'
    }

    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === pathSegments.length - 1
      
      breadcrumbs.push({
        name: segmentNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        current: isLast
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading STORM AI</h2>
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content area - flex layout to push footer down */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* System Health Warning */}
        {systemHealth && !systemHealth.healthy && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  System maintenance in progress. Some features may be temporarily unavailable.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <nav className="bg-white border-b border-gray-200 px-6 py-3">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.name} className="flex items-center">
                  {index > 0 && (
                    <svg className="h-4 w-4 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <a
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      {crumb.name}
                    </a>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        {/* Main content - flex-1 to take remaining space */}
        <main className="flex-1 overflow-auto focus:outline-none">
          <div className="relative">
            {/* Page Content with extra bottom padding for footer */}
            <div className="min-h-full pb-32">
              <div className="p-6">
                <Outlet />
              </div>
            </div>

            {/* Scroll to top button */}
            <ScrollToTopButton />
          </div>
        </main>
      </div>

      {/* Footer - positioned at bottom, outside main content */}
      <div className="lg:pl-64">
        <Footer />
      </div>

      {/* Keyboard shortcuts help modal */}
      <KeyboardShortcutsModal />

      {/* Connection status indicator */}
      <ConnectionStatus />
    </div>
  )
}

// Scroll to top button component
function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      const mainElement = document.querySelector('main')
      if (mainElement && mainElement.scrollTop > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    const mainElement = document.querySelector('main')
    mainElement?.addEventListener('scroll', toggleVisibility)

    return () => {
      mainElement?.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    const mainElement = document.querySelector('main')
    mainElement?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-6 z-30 p-3 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 border border-gray-200"
          aria-label="Scroll to top"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </>
  )
}

// Keyboard shortcuts modal component
function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Show shortcuts modal with Cmd/Ctrl + ?
      if ((event.metaKey || event.ctrlKey) && event.key === '?') {
        event.preventDefault()
        setIsOpen(true)
      }
      
      // Close modal with Escape
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [])

  if (!isOpen) return null

  const shortcuts = [
    { keys: ['⌘', 'K'], description: 'Open search' },
    { keys: ['⌘', '?'], description: 'Show keyboard shortcuts' },
    { keys: ['Esc'], description: 'Close modals/dropdowns' },
    { keys: ['G', 'D'], description: 'Go to Dashboard' },
    { keys: ['G', 'C'], description: 'Go to Contacts' },
    { keys: ['G', 'L'], description: 'Go to Leads' },
    { keys: ['G', 'J'], description: 'Go to Jobs' },
    { keys: ['G', 'E'], description: 'Go to Estimates' },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-gray-500 opacity-75" 
            onClick={() => setIsOpen(false)}
          ></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <div className="flex items-center space-x-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Connection status indicator
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      
      // Hide offline message after 5 seconds
      setTimeout(() => {
        setShowOfflineMessage(false)
      }, 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Show connection status indicator
  if (!isOnline && showOfflineMessage) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium">
            You're offline. Some features may not work properly.
          </span>
        </div>
      </div>
    )
  }

  // Show reconnection indicator
  if (isOnline && showOfflineMessage === false && !navigator.onLine) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">
            Back online! All features are now available.
          </span>
        </div>
      </div>
    )
  }

  return null
}