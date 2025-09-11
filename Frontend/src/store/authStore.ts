// frontend/src/store/authStore.ts - Enhanced Version
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  name: string
  role: string
  company_id: string
  avatar?: string | null // Support for profile picture URLs
  phone?: string
  last_login?: string
  created_at?: string
  status?: 'active' | 'inactive' | 'pending'
  permissions?: string[]
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: {
      email: boolean
      push: boolean
      sms: boolean
    }
    language?: string
    timezone?: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
  refreshToken: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (user, token) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true, 
          isLoading: false 
        })
      },

      logout: () => {
        // Clear all auth data
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false 
        })
        
        // Clear localStorage
        localStorage.removeItem('auth-storage')
        
        // Redirect to login (you can customize this)
        window.location.href = '/login'
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      refreshToken: async () => {
        const { token } = get()
        if (!token) {
          set({ isAuthenticated: false, isLoading: false })
          return
        }

        try {
          set({ isLoading: true })
          
          // Make API call to refresh token
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            throw new Error('Token refresh failed')
          }

          const data = await response.json()
          
          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          })
        } catch (error) {
          console.error('Token refresh failed:', error)
          // If refresh fails, logout user
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, validate token if needed
        if (state?.token && state?.isAuthenticated) {
          // Optionally verify token validity here
          console.log('Auth state rehydrated')
        }
      },
    }
  )
)

// Helper functions that can be used throughout your app
export const getAvatarUrl = (user: User | null): string | null => {
  if (!user) return null
  
  // Return user's avatar URL if it exists
  if (user.avatar) {
    return user.avatar
  }
  
  // You could also integrate with services like Gravatar
  // const gravatarUrl = `https://www.gravatar.com/avatar/${md5(user.email.toLowerCase())}?d=identicon&s=200`
  // return gravatarUrl
  
  return null
}

export const getUserInitials = (user: User | null): string => {
  if (!user?.name) return 'U'
  
  return user.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'User'
  return user.name || user.email.split('@')[0] || 'User'
}

// Avatar color generator based on user data
export const getAvatarColor = (user: User | null): string => {
  if (!user) return 'bg-gray-500'
  
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
    'bg-emerald-500',
    'bg-violet-500'
  ]
  
  // Create a hash based on user ID and name for consistency
  const identifier = user.id + (user.name || user.email)
  const hash = identifier.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return colors[hash % colors.length]
}