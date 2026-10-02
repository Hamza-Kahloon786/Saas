// frontend/src/pages/auth/Login.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { FiMenu, FiX } from 'react-icons/fi'
import ContactForm from '../../components/ContactForm'
import FreeTrialForm from '../../components/FreeTrialForm'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  
  // Navbar states
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [showContactForm, setShowContactForm] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    // defaultValues: {
    //   email: 'stormstore@company.com',
    //   password: 'Stormstore.'
    // }
  })

  // Navbar functions
  const openForm = () => {
    navigate('/register')
    setIsOpen(false)
  }

  const closeForm = () => {
    setShowForm(false)
  }

  const openContactForm = () => {
    setShowContactForm(true)
    setIsOpen(false)
  }

  const closeContactForm = () => {
    setShowContactForm(false)
  }

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      console.log('🎉 Login successful:', data)
      
      // Store user data
      login(data.user, data.access_token)
      
      // Store tokens for the auth service
      authService.setAuthData(data)
      
      toast.success(`Welcome back, ${data.user.first_name}!`)

      // 🎯 NEW: Check subscription status for customers only
      const userRole = data.user.role?.toLowerCase()
      const hasActiveSubscription = data.user.subscription?.status === 'active'
      
      console.log('📊 User role:', userRole)
      console.log('💳 Has active subscription:', hasActiveSubscription)
      
      // Only customers need to go to pricing if no subscription
      if (userRole === 'customer' && !hasActiveSubscription) {
        console.log('🏷️ Redirecting customer to pricing page...')
        navigate('/pricing', { replace: true })
        return
      }
      
      // Role-based redirection
      console.log('🔄 Redirecting based on role:', userRole)
      
      switch (userRole) {
        case 'customer':
          navigate('/customer-portal/dashboard', { replace: true })
          break
        case 'technician':
          navigate('/technician-portal/dashboard', { replace: true })
          break
        case 'admin':
        case 'manager':
        case 'owner':
        case 'user':
        default:
          navigate('/dashboard', { replace: true })
          break
      }
    },
    onError: (error: any) => {
      console.error('❌ Login failed:', error)
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please check your credentials.'
      
      toast.error(errorMessage)
    },
  })

  const onSubmit = (data: LoginForm) => {
    console.log('🔐 Attempting login for:', data.email)
    loginMutation.mutate(data)
  }

  return (
    <>
      {/* Inline Navbar */}
      <nav className="bg-white fixed top-0 left-0 w-full z-50 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-2">
              <img src="/Storm AI Logo.png" alt="Logo" className="h-40 w-auto" />
            </a>

            <div className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Features
              </a>
              <a href="/#industries" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Industries
              </a>
              <a href="/#pricing" className="text-[#0F1724] hover:text-[#0038FF] transition">
                Pricing
              </a>
              <button onClick={openContactForm} className="text-[#0F1724] hover:text-[#0038FF] transition">
                Contact Us
              </button>
              <button onClick={openForm} className=" text-black px-4 py-2 rounded-lg shadow hover:opacity-90 transition">
                Start Free Trial
              </button>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
                {isOpen ? (
                  <FiX size={24} className="text-[#0F1724]" />
                ) : (
                  <FiMenu size={24} className="text-[#0F1724]" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-sm">
            <div className="px-4 py-4 space-y-3">
              <a href="/#features" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Features
              </a>
              <a href="/#industries" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Industries
              </a>
              <a href="/#pricing" onClick={() => setIsOpen(false)} className="block text-[#0F1724] hover:text-[#0038FF] transition">
                Pricing
              </a>
              <button onClick={openContactForm} className="block text-[#0F1724] hover:text-[#0038FF] transition w-full text-left">
                Contact Us
              </button>
              <button onClick={openForm} className="block text-black px-4 py-2 rounded-lg text-center w-full hover:opacity-90 transition">
                Start Free Trial
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Free Trial Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button onClick={closeForm} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold" aria-label="Close modal">
              &times;
            </button>
            <FreeTrialForm />
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative shadow-lg">
            <button onClick={closeContactForm} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold" aria-label="Close modal">
              &times;
            </button>
            <ContactForm onClose={closeContactForm} />
          </div>
        </div>
      )}
      
      <div className="min-h-screen flex bg-gray-50 pt-16">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 py-8 sm:py-12 lg:py-16">
          
          {/* Form Container */}
          <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm">
            
            {/* Login Header */}
            <div className="mb-6 sm:mb-8 text-center">
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <img 
                    src="/rlogow.png" 
                    alt="Logo" 
                    className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                  />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Login
              </h2>
            </div>

            {/* Login Form */}
            <div className="space-y-5 sm:space-y-6">
              {/* Email Field */}
              <div>
                {/* <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label> */}
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base outline-none"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                {/* <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label> */}
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm sm:text-base outline-none"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-black hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={loginMutation.isPending}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="text-sm">Signing in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>

              {/* Divider */}
              {/* <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 sm:px-4 bg-gray-50 text-gray-500 text-xs sm:text-sm">Or continue with</span>
                </div>
              </div> */}

              {/* Google Login Button */}
              {/* <GoogleLoginButton /> */}
            </div>

            {/* Register Link */}
            <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up for free
              </Link>
            </p>

            {/* Forgot Password */}
            <div className="flex flex-col text-center sm:flex-row sm:items-center sm:justify-center space-y-3 sm:space-y-0 mt-4">
              <div className="text-xs sm:text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-center text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side - CRM Dashboard Preview (Hidden on mobile and tablet) */}
        <div className="hidden xl:block relative w-0 flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-center items-center px-12 py-16">
            <div className="text-center text-white mb-12 max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                Effortlessly manage your team and operations.
              </h2>
              <p className="text-lg opacity-90">
                Log in to access your CRM dashboard and manage your team.
              </p>
            </div>
            
            {/* Dashboard Preview */}
            <div className="w-full max-w-3xl mx-auto">
              <div className="bg-white rounded-3xl p-8 shadow-2xl">
                <img 
                  src="/dashboard.png" 
                  alt="STORM AI Dashboard Preview" 
                  className="w-full h-auto rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}