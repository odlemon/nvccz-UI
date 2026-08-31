"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import { Eye, EyeOff, User, Loader2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loginSchema, type LoginFormData } from "@/lib/validations/auth"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { loginUser, clearError } from "@/lib/store/slices/authSlice"
import { getRoleBasedRedirect } from "@/lib/utils/role-redirect"
import { PORTAL_ID, portalHomePath, portalLoginMeta, fundingApplicationPublicUrl } from "@/lib/portal/config"
import { toast } from "sonner"
import { MatanhoAuthShell, MATANHO_TEAL } from "@/components/auth/matanho-auth-shell"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M12 1h10v10H12z" />
      <path fill="#7FBA00" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const { error, isAuthenticated, userDetails, isFetchingDetails, user } = useAppSelector((state) => state.auth)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  useEffect(() => {
    if (!isAuthenticated || !isSubmitting || isFetchingDetails) return

    if (userDetails) {
      const redirect = getRoleBasedRedirect(
        userDetails,
        userDetails.role.name.toLowerCase() === "applicant",
        PORTAL_ID
      )

      if (redirect.shouldRedirect) {
        toast.success("Login successful!", {
          description: `Welcome back, ${userDetails.firstName}!`,
        })

        setTimeout(() => {
          window.location.href = redirect.path
        }, 100)
      }
      setIsSubmitting(false)
      return
    }

    if (user) {
      const path = portalHomePath(PORTAL_ID)
      toast.success("Login successful!", {
        description: `Welcome back, ${user.firstName}!`,
      })
      setTimeout(() => {
        window.location.href = path
      }, 100)
      setIsSubmitting(false)
    }
  }, [isAuthenticated, userDetails, isFetchingDetails, isSubmitting, user, router])

  const onSubmit = async (data: LoginFormData) => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)
      await dispatch(loginUser({ ...data, portal: PORTAL_ID })).unwrap()
    } catch (err: any) {
      toast.error("Login failed", {
        description: err || "Please check your credentials and try again.",
      })
      console.error("Login error:", err)
      setIsSubmitting(false)
    }
  }

  const isLoading = isSubmitting || (isAuthenticated && isFetchingDetails)

  const inputClass =
    "block w-full h-12 pl-4 pr-11 rounded-xl bg-[#0E1520]/80 border border-white/15 text-white text-sm placeholder:text-white/35 outline-none focus:border-[#14C4CE] focus:ring-1 focus:ring-[#14C4CE]/40 transition-colors disabled:opacity-50"

  const loginMeta = portalLoginMeta(PORTAL_ID)
  const isStaffPortal = PORTAL_ID === 'staff'

  return (
    <MatanhoAuthShell>
      <div className="mb-7">
        <h2 className="text-[28px] sm:text-[30px] font-semibold text-white tracking-tight">{loginMeta.title}</h2>
        <p className="mt-1.5 text-[14px] text-white/55">{loginMeta.subtitle}</p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-400/30 text-red-200 text-sm">{error}</div>
      )}

      {isAuthenticated && isFetchingDetails && (
        <div className="mb-5 p-3 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-100 text-sm flex items-center gap-2">
          <Loader2 className="animate-spin h-4 w-4 shrink-0" />
          Loading your profile...
        </div>
      )}

      <form method="post" action="#" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-[13px] text-white/65 mb-1.5">Email address</label>
          <div className="relative">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="email"
                  autoComplete="email"
                  placeholder="name@matanho.com"
                  disabled={isLoading}
                  className={inputClass}
                />
              )}
            />
            <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 pointer-events-none" />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-[13px] text-white/65 mb-1.5">Password</label>
          <div className="relative">
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className={inputClass}
                />
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50 p-0.5"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-300">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between gap-3 pt-0.5">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="h-4 w-4 rounded border-white/30 accent-[#14C4CE] cursor-pointer disabled:opacity-50"
            />
            <span className="text-[13px] text-white/90">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-[13px] font-medium hover:underline underline-offset-2"
            style={{ color: MATANHO_TEAL }}
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-full text-white text-[15px] font-semibold shadow-lg shadow-black/25 transition-opacity hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{ backgroundColor: MATANHO_TEAL }}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              {isFetchingDetails ? "Loading profile..." : "Signing in..."}
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <div className="mt-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-[12px] text-white/45 shrink-0">or continue with</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => toast("Google sign-in", { description: "SSO will be available soon." })}
          className="h-11 w-11 rounded-full border border-white/15 bg-[#0E1520]/70 hover:bg-white/10 inline-flex items-center justify-center transition-colors"
          aria-label="Continue with Google"
        >
          <GoogleIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => toast("Microsoft sign-in", { description: "SSO will be available soon." })}
          className="h-11 w-11 rounded-full border border-white/15 bg-[#0E1520]/70 hover:bg-white/10 inline-flex items-center justify-center transition-colors"
          aria-label="Continue with Microsoft"
        >
          <MicrosoftIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => toast("Secure sign-in", { description: "Additional auth options coming soon." })}
          className="h-11 w-11 rounded-full border border-white/15 bg-[#0E1520]/70 hover:bg-white/10 inline-flex items-center justify-center transition-colors"
          aria-label="Secure sign-in"
        >
          <Lock className="h-4 w-4 text-white/85" />
        </button>
      </div>

      {isStaffPortal && (
      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-x-4 gap-y-2 text-[12px] text-white/45">
        <button
          type="button"
          onClick={() => {
            const url = fundingApplicationPublicUrl()
            if (/^https?:\/\//i.test(url)) window.location.href = url
            else router.push(url)
          }}
          className="hover:text-white/80 transition-colors"
        >
          Submit application
        </button>
        <span className="hidden sm:inline text-white/20">·</span>
        <Link href="/vendor-portal/register" className="hover:text-white/80 transition-colors">
          Register as vendor
        </Link>
      </div>
      )}
    </MatanhoAuthShell>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
