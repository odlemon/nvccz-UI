"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser } from "@/lib/store/slices/authSlice"
import { InvesteePortalV8App } from "@/components/investee-portal-v8-mock/investee-portal-v8-app"
import { toast } from "sonner"

function isApplicantRole(userDetails: { roleCode?: string; role?: { name?: string } } | null, user: { role?: string } | null) {
  const roleCode = (userDetails?.roleCode || "").toString().toLowerCase()
  const roleName =
    typeof userDetails?.role === "string"
      ? userDetails.role.toLowerCase()
      : (userDetails?.role?.name || user?.role || "").toString().toLowerCase()
  return roleCode === "applicant" || roleName === "applicant"
}

export function InvesteePortalV8AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user, userDetails, isFetchingDetails, isAuthenticated, isLoading } = useAppSelector(
    (state) => state.auth
  )

  const sessionResolved = !isLoading && !isFetchingDetails
  const applicantVerified =
    sessionResolved && isAuthenticated && (userDetails ? isApplicantRole(userDetails, user) : false)

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(`/login?from=${encodeURIComponent(pathname || "/investee-portal-v8")}`)
      return
    }
    if (isFetchingDetails || !userDetails) return

    if (!isApplicantRole(userDetails, user)) {
      toast.error("This portal is for investee accounts only.")
      dispatch(logoutUser()).finally(() => router.replace("/login"))
    }
  }, [isLoading, isAuthenticated, isFetchingDetails, user, userDetails, dispatch, router, pathname])

  if (!sessionResolved || !isAuthenticated || !applicantVerified) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f6fb]">
        <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#f3f6fb]">
      <InvesteePortalV8App />
      <div className="sr-only" aria-hidden>
        {children}
      </div>
    </div>
  )
}
