"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, ArrowLeft, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useAppDispatch } from "@/lib/store"
import { resetPassword } from "@/lib/store/slices/authSlice"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const dispatch = useAppDispatch()
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setIsSubmitting(true)
      await dispatch(resetPassword({ token, newPassword })).unwrap()
      setResetSuccess(true)
      toast.success('Password reset successfully!', {
        description: 'You can now login with your new password'
      })
    } catch (error: any) {
      toast.error('Failed to reset password', {
        description: error || 'The reset link may have expired. Please request a new one.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (resetSuccess) {
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Reset Complete</h1>
              <p className="text-gray-600">
                Your password has been successfully reset. You can now login with your new password.
              </p>
            </div>

            <Button
              onClick={() => router.push('/login')}
              variant="gradient"
              size="lg"
              className="w-full rounded-full"
            >
              Go to Login
            </Button>
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
              <h1 className="text-4xl text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600 text-lg">
                Enter your new password below
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
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  disabled={isSubmitting}
                  required
                  minLength={8}
                  className={`block w-full pl-12 pr-12 py-3 border rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-300 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  required
                  minLength={8}
                  className={`block w-full pl-12 pr-12 py-3 border rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-gray-300 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </motion.div>

              {newPassword && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm space-y-1"
                >
                  <p className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${newPassword.length >= 8 ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {newPassword.length >= 8 && <CheckCircle2 className="w-3 h-3" />}
                    </span>
                    At least 8 characters
                  </p>
                  <p className={`flex items-center gap-2 ${confirmPassword && newPassword === confirmPassword ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${confirmPassword && newPassword === confirmPassword ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {confirmPassword && newPassword === confirmPassword && <CheckCircle2 className="w-3 h-3" />}
                    </span>
                    Passwords match
                  </p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="gradient"
                  size="lg"
                  className="w-full rounded-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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

      {/* Right Section */}
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
                  Create a Strong Password
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
                      <div className="w-full h-full bg-white/40 rounded-2xl transform rotate-12 flex items-center justify-center">
                        <Lock className="w-12 h-12 text-white" />
                      </div>
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
                    Choose a strong password to keep your account secure. Make sure it's at least 8 characters long.
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
