


// frontend/src/pages/auth/Register.tsx - With inline Navbar
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { useAuthStore } from '../../store/authStore'
import { 
  EyeIcon, 
  EyeSlashIcon,
  UserIcon
} from '@heroicons/react/24/outline'
import { FiMenu, FiX } from 'react-icons/fi'
import ContactForm from '../../components/ContactForm'

// Simplified registration schema - customer only
const registerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Navbar states
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [showContactForm, setShowContactForm] = useState<boolean>(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  // Navbar functions
  const openContactForm = () => {
    setShowContactForm(true)
    setIsOpen(false)
  }

  const closeContactForm = () => {
    setShowContactForm(false)
  }

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      console.log('🎉 Registration successful:', data)
      
      // Store user data
      login(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.first_name}! Your customer account has been created.`)

      // 🎯 NEW: Check subscription status first
      const userRole = data.user.role?.toLowerCase()
      const hasActiveSubscription = data.user.subscription?.status === 'active'
      
      console.log('📊 User role:', userRole)
      console.log('💳 Has active subscription:', hasActiveSubscription)
      
      // If no active subscription, redirect to pricing
      if (!hasActiveSubscription) {
        console.log('🏷️ Redirecting to pricing page...')
        navigate('/pricing', { replace: true })
        return
      }
      
      // If has active subscription, redirect to customer portal
      console.log('🔄 Redirecting to customer portal dashboard')
      navigate('/customer-portal/dashboard', { replace: true })
    },
    onError: (error: any) => {
      console.error('❌ Registration error:', error)
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response?.data?.detail
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err: any) => {
            toast.error(`${err.loc?.join(' → ')}: ${err.msg}`)
          })
        } else {
          toast.error('Please check your input and try again')
        }
      } else {
        toast.error(error.response?.data?.detail || 'Registration failed')
      }
    },
  })

  const onSubmit = (data: RegisterForm) => {
    console.log('📝 Form data before submission:', data)
    
    // Remove confirmPassword and terms, add fixed role
    const { confirmPassword, terms, ...formData } = data
    
    // Always register as customer
    const registerData = {
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: 'customer' as const, // Fixed role
      company_name: undefined, // Not needed for customers
    }
    
    console.log('🚀 Sending registration data:', registerData)
    registerMutation.mutate(registerData)
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
              <button onClick={() => navigate('/login')} className="text-[#0F1724] hover:text-[#0038FF] transition font-medium">
                Login
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
              <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="block text-[#0F1724] hover:text-[#0038FF] transition font-medium w-full text-left">
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

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
        {/* Left Side - Registration Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-20 xl:px-24 py-8 sm:py-12 lg:py-16">
          
          {/* Form Container */}
          <div className="mx-auto w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm">
            
            {/* Register Header */}
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
                Register
              </h2>
            </div>

            {/* Registration Form */}
            <div className="space-y-4 sm:space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register('first_name')}
                    type="text"
                    autoComplete="given-name"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-xs sm:text-sm outline-none"
                    placeholder="First name"
                  />
                  {errors.first_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register('last_name')}
                    type="text"
                    autoComplete="family-name"
                    className="w-full px-2.5 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-xs sm:text-sm outline-none"
                    placeholder="Last name"
                  />
                  {errors.last_name && (
                    <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm outline-none"
                  placeholder="Email address"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password Fields */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm outline-none"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-sm outline-none"
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-2">
                <input
                  {...register('terms')}
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
                />
                <label htmlFor="terms" className="block text-xs sm:text-sm text-gray-900 leading-relaxed">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-xs text-red-600">{errors.terms.message}</p>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={registerMutation.isPending}
                className="w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span className="text-sm">Creating account...</span>
                  </div>
                ) : (
                  'Create Customer Account'
                )}
              </button>
            </div>

            {/* Login Link */}
            <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - CRM Dashboard Preview (Hidden on mobile and tablet) */}
        <div className="hidden xl:block relative w-0 flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-center items-center px-12 py-16">
            <div className="text-center text-white mb-12 max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                Join thousands of satisfied customers.
              </h2>
              <p className="text-lg opacity-90">
                Get started with your free account and experience our premium service management platform.
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