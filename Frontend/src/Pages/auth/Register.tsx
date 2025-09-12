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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (data) => {
      console.log('🎉 Registration successful:', data)
      
      // Store user data
      login(data.user, data.access_token)
      toast.success(`Welcome, ${data.user.first_name}! Your customer account has been created.`)

      // Always redirect customers to customer portal
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Logo Section - Top Left */}
        <div className="absolute top-4 left-8 flex items-center">
          <img 
            src="/rlogo.png" 
            alt="STORM AI Logo" 
            className="h-6 w-6 object-contain mr-2"
          />
          <span className="text-lg font-bold text-gray-900">STORM AI</span>
        </div>
        
        {/* Form Container */}
        <div className="mx-auto w-full max-w-sm mt-16">
          {/* Create your STORM AI account */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Create your STORM AI account
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Join our platform to book services and manage your appointments
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  {...register('first_name')}
                  type="text"
                  autoComplete="given-name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
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
            <div className="flex items-start">
              <input
                {...register('terms')}
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="terms" className="ml-2 block text-xs text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-xs text-red-600">{errors.terms.message}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {registerMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create Customer Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-4 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - CRM Dashboard Preview */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center items-center px-12 py-16">
          <div className="text-center text-white mb-12 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 leading-tight">
              Join thousands of satisfied customers.
            </h2>
            <p className="text-lg opacity-90">
              Get started with your free account and experience our premium service management platform.
            </p>
          </div>
          
          {/* Dashboard Preview - Using your dashboard image */}
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
  )
}