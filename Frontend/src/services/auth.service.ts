// frontend/src/services/auth.service.ts - FINAL PRODUCTION VERSION
import api from './api'
import type { ApiResponse } from './api'

/* ----------------------- TYPES ----------------------- */
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'technician' | 'sales'
  company_id: string
  avatar_url?: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
  permissions: string[]
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  timezone: string
  language: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
    job_updates: boolean
    payment_updates: boolean
  }
  dashboard_layout: Record<string, any>
}

export interface LoginRequest { 
  email: string
  password: string
  remember_me?: boolean 
}

export interface RegisterRequest { 
  email: string
  password: string
  name: string
  company_name: string
  phone?: string
  industry?: string 
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface PasswordResetConfirm { 
  token: string
  password: string
  password_confirm: string 
}

export interface ChangePasswordRequest { 
  current_password: string
  new_password: string
  new_password_confirm: string 
}

export interface UpdateProfileRequest { 
  name?: string
  phone?: string
  avatar_url?: string
  preferences?: Partial<UserPreferences> 
}

/* -------------------------------- SERVICE -------------------------------- */
class AuthService {
  
  // In auth.service.ts, update the login method:
// frontend/src/services/auth.service.ts - FIXED LOGIN METHOD
async login(credentials: LoginRequest): Promise<AuthResponse> {
  console.log('🔐 AuthService.login() called with:', { email: credentials.email })
  
  // FIXED: Use URLSearchParams instead of FormData for OAuth2PasswordRequestForm
  const params = new URLSearchParams()
  params.append('username', credentials.email)  // Note: username, not email
  params.append('password', credentials.password)
  params.append('grant_type', 'password')
  if (credentials.remember_me) params.append('remember_me', 'true')

  console.log('📡 Making login request to: /auth/login')
  
  try {
    const { data } = await api.post('/auth/login', params, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'  // FIXED: Correct content type
      },
    })
    
    console.log('✅ Login successful, raw response:', data)
    
    return {
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token || '',
      token_type: data.token_type || 'bearer',
      expires_in: data.expires_in || 3600
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data || error.message)
    throw error
  }
}

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    console.log('📝 AuthService.register() called with:', { 
      email: userData.email, 
      name: userData.name, 
      company_name: userData.company_name 
    })
    
    console.log('📡 Making register request to: /auth/register')
    
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', userData)
      
      console.log('✅ Registration successful for user:', data.user.email)
      return data
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message)
      throw error
    }
  }

  async logout(): Promise<void> {
    console.log('🚪 AuthService.logout() called')
    
    try {
      await api.post('/auth/logout')
      console.log('✅ Logout successful')
    } catch (error: any) {
      console.error('❌ Logout failed:', error.response?.data || error.message)
      // Don't throw error for logout - we'll clear local state anyway
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    console.log('🔄 AuthService.refreshToken() called')
    
    try {
      const { data } = await api.post<AuthResponse>('/auth/refresh')
      console.log('✅ Token refresh successful')
      return data
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.response?.data || error.message)
      throw error
    }
  }

  async getCurrentUser(): Promise<User> {
    console.log('👤 AuthService.getCurrentUser() called')
    
    try {
      const { data } = await api.get<User>('/auth/me')
      console.log('✅ Current user fetched:', data.email)
      return data
    } catch (error: any) {
      console.error('❌ Get current user failed:', error.response?.data || error.message)
      throw error
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log('🔒 AuthService.forgotPassword() called with email:', email)
    
    try {
      const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email })
      console.log('✅ Forgot password email sent')
      return data
    } catch (error: any) {
      console.error('❌ Forgot password failed:', error.response?.data || error.message)
      throw error
    }
  }

  async resetPassword(resetData: PasswordResetConfirm): Promise<{ message: string }> {
    console.log('🔑 AuthService.resetPassword() called')
    
    try {
      const { data } = await api.post<{ message: string }>('/auth/reset-password', resetData)
      console.log('✅ Password reset successful')
      return data
    } catch (error: any) {
      console.error('❌ Password reset failed:', error.response?.data || error.message)
      throw error
    }
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    console.log('🔐 AuthService.changePassword() called')
    
    try {
      const { data } = await api.put<{ message: string }>('/auth/change-password', passwordData)
      console.log('✅ Password change successful')
      return data
    } catch (error: any) {
      console.error('❌ Password change failed:', error.response?.data || error.message)
      throw error
    }
  }

  async updateProfile(profileData: UpdateProfileRequest): Promise<User> {
    console.log('✏️ AuthService.updateProfile() called')
    
    try {
      const { data } = await api.put<User>('/auth/profile', profileData)
      console.log('✅ Profile update successful')
      return data
    } catch (error: any) {
      console.error('❌ Profile update failed:', error.response?.data || error.message)
      throw error
    }
  }

  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    console.log('📷 AuthService.uploadAvatar() called with file:', file.name)
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    try {
      const { data } = await api.post<{ avatar_url: string }>('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('✅ Avatar upload successful')
      return data
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error.response?.data || error.message)
      throw error
    }
  }

  // Additional helper methods for session management
  async verifySession(): Promise<boolean> {
    try {
      await this.getCurrentUser()
      return true
    } catch {
      return false
    }
  }

  async refreshSessionIfNeeded(): Promise<AuthResponse | null> {
    try {
      return await this.refreshToken()
    } catch {
      return null
    }
  }

  // Company and user management methods
  async getCompanySettings(): Promise<any> {
    console.log('🏢 AuthService.getCompanySettings() called')
    
    try {
      const { data } = await api.get('/auth/company/settings')
      return data
    } catch (error: any) {
      console.error('❌ Get company settings failed:', error.response?.data || error.message)
      throw error
    }
  }

  async updateCompanySettings(settings: any): Promise<any> {
    console.log('🏢 AuthService.updateCompanySettings() called')
    
    try {
      const { data } = await api.put('/auth/company/settings', settings)
      console.log('✅ Company settings updated')
      return data
    } catch (error: any) {
      console.error('❌ Company settings update failed:', error.response?.data || error.message)
      throw error
    }
  }

  async getUserSubscription(): Promise<any> {
    console.log('💳 AuthService.getUserSubscription() called')
    
    try {
      const { data } = await api.get('/auth/subscription')
      return data
    } catch (error: any) {
      console.error('❌ Get subscription failed:', error.response?.data || error.message)
      throw error
    }
  }

  async updateSubscription(planId: string): Promise<any> {
    console.log('💳 AuthService.updateSubscription() called with plan:', planId)
    
    try {
      const { data } = await api.post('/auth/subscription/update', { plan_id: planId })
      console.log('✅ Subscription updated')
      return data
    } catch (error: any) {
      console.error('❌ Subscription update failed:', error.response?.data || error.message)
      throw error
    }
  }

  // Session validation and auto-refresh
  async validateAndRefreshSession(): Promise<{ valid: boolean; user?: User }> {
    try {
      const user = await this.getCurrentUser()
      return { valid: true, user }
    } catch (error: any) {
      // If 401, try to refresh token
      if (error.response?.status === 401) {
        try {
          const authResponse = await this.refreshToken()
          return { valid: true, user: authResponse.user }
        } catch (refreshError) {
          return { valid: false }
        }
      }
      return { valid: false }
    }
  }
}

export const authService = new AuthService()
export default authService