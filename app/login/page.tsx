"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { motion } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { loginUser, clearError } from "@/lib/store/slices/authSlice"
import { getRoleBasedRedirect } from "@/lib/utils/role-redirect"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const { error, isAuthenticated, userDetails, isFetchingDetails } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Clear error when component unmounts or when user starts typing
  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  // Handle redirect after user details are fetched
  useEffect(() => {
    if (isAuthenticated && userDetails && !isFetchingDetails && isSubmitting) {
      const redirect = getRoleBasedRedirect(userDetails, userDetails.role.name.toLowerCase() === 'applicant')

      if (redirect.shouldRedirect) {
        toast.success('Login successful!', {
          description: `Welcome back, ${userDetails.firstName}!`
        })

        // Small delay to ensure cookies are set
        setTimeout(() => {
          window.location.href = redirect.path
        }, 100)
      }
    }
  }, [isAuthenticated, userDetails, isFetchingDetails, isSubmitting, router])

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return // Prevent double submission

    try {
      setIsSubmitting(true)

      // Login will automatically trigger fetchUserDetails in the authSlice
      await dispatch(loginUser(data)).unwrap()

      // The redirect will be handled by the useEffect above once userDetails are loaded
      // Don't redirect here, wait for userDetails to be fetched

    } catch (error: any) {
      // Error toast
      toast.error('Login failed', {
        description: error || 'Please check your credentials and try again.'
      })

      console.error('Login error:', error)
      setIsSubmitting(false) // Reset on error
    }
  }

  // Show loading state while fetching user details after successful login
  const isLoading = isSubmitting || (isAuthenticated && isFetchingDetails)

  return (
    <div className="min-h-screen bg-white flex gap-4 p-4 md:p-8">
      {/* Left Section - Login Form */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full max-w-2xl"
        >
          {/* Form Card */}
          <div className="rounded-3xl p-6 md:p-8 h-full flex flex-col justify-center" style={{ backgroundColor: '#F8F8F8' }}>
            {/* Logo */}
            <div className="text-left mb-8 px-4 md:px-12">
              <div className="inline-flex items-center justify-center mb-4">
                <Image
                  src="/logo_copy.png"
                  alt="Arcus Logo"
                  width={200}
                  height={200}
                  className=" object-contain"
                />
              </div>
              <h1 className="text-4xl text-gray-900 mb-2">Welcome to Arcus</h1>
              <p className="text-gray-600 text-lg">
                Financial intelligence and portfolio management powered by AI
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mx-4 md:mx-12"
              >
                {error}
              </motion.div>
            )}

            {/* Loading State - Fetching User Details */}
            {isAuthenticated && isFetchingDetails && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm mx-4 md:mx-12 flex items-center"
              >
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Loading your profile...
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4 md:px-12">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={isLoading}
                      className={`block w-full pl-12 pr-4 py-3 border rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.email ? 'border-red-300' : 'border-gray-300'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  )}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      className={`block w-full pl-12 pr-12 py-3 border rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.password ? 'border-red-300' : 'border-gray-300'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </motion.div>

              {/* Sign In Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="gradient"
                  size="lg"
                  className="w-full rounded-full cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      {isFetchingDetails ? 'Loading profile...' : 'Signing in...'}
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </motion.div>

              {/* Submit Application Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  type="button"
                  variant="gradient"
                  size="lg"
                  className="w-full rounded-full cursor-pointer"
                  disabled={isLoading}
                  onClick={() => router.push('/applications/form')}
                >
                  Submit Application
                </Button>
              </motion.div>

              {/* Sign Up Link */}
              {/* <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-center"
              >
                <span className="text-gray-600 text-sm">
                  Don't have an account?{' '}
                </span>
                <Link
                  href="/auth/register"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  Sign up
                </Link>
              </motion.div> */}
            </form>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 px-4 md:px-12 flex flex-col sm:flex-row items-center justify-center gap-2 sm:space-x-2 text-sm text-gray-500"
            >
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-white"></div>
              </div>
              <span>Join 10,000+ investors</span>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Section - Promotional Banner */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full max-w-2xl"
        >
          <div className="rounded-3xl p-8 h-full flex flex-col justify-center relative overflow-hidden" style={{ backgroundColor: '#F8F8F8' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-90 rounded-3xl"></div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="relative z-10 flex flex-col justify-center items-center text-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-md"
              >
                <h2 className="text-3xl mb-4 leading-tight">
                  AI Revolutionizing the way we create, manage, and experience financial intelligence
                </h2>

                {/* 3D-like Graphic */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="relative w-48 h-48 mx-auto">
                    {/* Abstract 3D-like structure */}
                    <div className="absolute inset-0 transform rotate-12">
                      <div className="w-full h-full bg-white/20 rounded-2xl transform rotate-45"></div>
                    </div>
                    <div className="absolute inset-4 transform -rotate-12">
                      <div className="w-full h-full bg-white/30 rounded-2xl transform -rotate-45"></div>
                    </div>
                    <div className="absolute inset-8 transform rotate-6">
                      <div className="w-full h-full bg-white/40 rounded-2xl transform rotate-12"></div>
                    </div>
                  </div>
                </motion.div>

                {/* Feature Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-lg font-semibold">AI</span>
                    </div>
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                      <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                    </div>
                  </div>
                  <p className="text-lg leading-relaxed">
                    Create investment strategies with AI voice commands to make intelligent financial decisions that suit your needs.
                  </p>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
