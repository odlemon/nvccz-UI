"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAppDispatch } from "@/lib/store"
import { forgotPassword } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await dispatch(forgotPassword(email)).unwrap()
      setSubmitted(true)

      // Display backend message if available, otherwise use default
      const successMessage = response?.message || 'Reset link sent!'
      const successDescription = response?.message
        ? undefined
        : 'Check your email for password reset instructions'

      toast.success(successMessage, {
        description: successDescription
      })
    } catch (error: any) {
      // Display backend error message if available, otherwise use default
      const errorMessage = error?.message || error || 'Failed to send reset email'
      const errorDescription = error?.message
        ? undefined
        : 'Please try again later'

      toast.error(errorMessage, {
        description: errorDescription
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="rounded-3xl p-8" style={{ backgroundColor: '#F8F8F8' }}>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
              <p className="text-gray-600">
                If an account with <span className="font-medium">{email}</span> exists,
                we've sent password reset instructions to your email.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Didn't receive the email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Check your spam folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>Wait a few minutes and try again</li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                size="lg"
                className="w-full rounded-full h-12"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex overflow-hidden gap-4 p-4">
      {/* Left Section - Form */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full max-w-2xl"
        >
          <div className="rounded-3xl p-8 h-full flex flex-col justify-center" style={{ backgroundColor: '#F8F8F8' }}>
            {/* Logo */}
            <div className="text-left mb-8 px-12">
              <div className="inline-flex items-center justify-center mb-4">
                <Image
                  src="/logo.png"
                  alt="Arcus Logo"
                  width={200}
                  height={200}
                  className="object-contain"
                />
              </div>
              <h1 className="text-4xl text-gray-900 mb-2">Forgot Password?</h1>
              <p className="text-gray-600 text-lg">
                No worries, we'll send you reset instructions
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 px-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  required
                  className={`block w-full pl-12 pr-4 py-3 border rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-300 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="gradient-info"
                  size="lg"
                  className="w-full rounded-full h-12 shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Login
                </Link>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Right Section - Same as login */}
      <div className="hidden lg:flex lg:flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full max-w-2xl"
        >
          <div className="rounded-3xl p-8 h-full flex flex-col justify-center relative overflow-hidden" style={{ backgroundColor: '#F8F8F8' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-90 rounded-3xl"></div>

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
                  Secure Password Recovery
                </h2>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="relative w-48 h-48 mx-auto">
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

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                >
                  <p className="text-lg leading-relaxed">
                    We'll send you a secure link to reset your password and regain access to your account.
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
