// frontend/src/pages/auth/ForgotPassword.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/auth.service'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: authService.forgotPassword,
    onSuccess: () => {
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send reset email')
    },
  })

  const onSubmit = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data.email)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Left Side - Success Message */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          {/* Logo Section - Top Left */}
          <div className="absolute top-8 left-8 flex items-center">
            <img 
              src="/rlogo.png" 
              alt="STORM AI Logo" 
              className="h-6 w-6 object-contain mr-2"
            />
            <span className="text-base font-bold text-gray-900">STORM AI</span>
          </div>
          
          {/* Form Container */}
          <div className="mx-auto w-full max-w-sm mt-16">
            {/* Check your email */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-sm text-gray-600">
                We've sent a password reset link to{' '}
                <span className="font-medium text-gray-900">{getValues('email')}</span>
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Email sent successfully!
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      Click the link in the email to reset your password. The link will expire in 1 hour.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-center text-xs text-gray-600">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  try again
                </button>
              </p>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - CRM Dashboard Preview */}
        <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-600 to-indigo-700 overflow-hidden">
          <div className="absolute inset-0 flex flex-col justify-center items-center px-12 py-16">
            <div className="text-center text-white mb-12 max-w-xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                Secure password recovery made simple.
              </h2>
              <p className="text-lg opacity-90">
                We'll help you get back into your account quickly and securely.
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
          
          {/* Privacy Policy Link */}
          <div className="absolute bottom-6 right-6">
            <Link
              to="/privacy-policy"
              className="text-white/70 hover:text-white text-sm underline transition-colors duration-200"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Forgot Password Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        {/* Logo Section - Top Left */}
        <div className="absolute top-8 left-8 flex items-center">
          <img 
            src="/rlogo.png" 
            alt="STORM AI Logo" 
            className="h-6 w-6 object-contain mr-2"
          />
          <span className="text-xl font-bold text-gray-900">STORM AI</span>
        </div>
        
        {/* Form Container */}
        <div className="mx-auto w-full max-w-sm mt-16">
          {/* Forgot Password */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot your password?
            </h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Reset Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-white text-sm"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {forgotPasswordMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to sign in
            </Link>
          </div>

          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-center text-xs text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - CRM Dashboard Preview */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-primary-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-center items-center px-12 py-16">
          <div className="text-center text-white mb-12 max-w-xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 leading-tight">
              Reset your password securely.
            </h2>
            <p className="text-lg opacity-90">
              We'll send you a secure link to reset your password and get you back to managing your business.
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