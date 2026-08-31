"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { logoutUser, refreshUserDetails } from "@/lib/store/slices/authSlice"
import { clearAuthCookies } from "@/lib/utils/cookies"
import {
  buildHv3SessionUser,
  type Hv3SessionUser,
} from "@/lib/home-v3-mock/session-user"

declare global {
  interface Window {
    __CLIENT_DESIGN_SIGN_OUT__?: (() => void) | null
    __CLIENT_DESIGN_SESSION_USER__?: Hv3SessionUser | null
  }
}

/** Live logout + session user for all client-design mock modules. */
export function useClientDesignAuthBridge() {
  const dispatch = useAppDispatch()
  const signOutRef = useRef<() => Promise<void>>(async () => {})
  const { user, userDetails, isFetchingDetails } = useAppSelector(
    (state) => state.auth
  )

  useEffect(() => {
    signOutRef.current = async () => {
      try {
        await dispatch(logoutUser()).unwrap()
        toast.success("Logged out successfully!")
      } catch {
        toast.error("Logout completed with warnings.")
      } finally {
        clearAuthCookies()
        window.location.replace("/login")
      }
    }
    window.__CLIENT_DESIGN_SIGN_OUT__ = () => {
      void signOutRef.current()
    }
    window.__HOME_V3_SIGN_OUT__ = window.__CLIENT_DESIGN_SIGN_OUT__
    return () => {
      delete window.__CLIENT_DESIGN_SIGN_OUT__
      delete window.__HOME_V3_SIGN_OUT__
    }
  }, [dispatch])

  useEffect(() => {
    if (!user?.id || userDetails || isFetchingDetails) return
    void dispatch(refreshUserDetails(user.id))
  }, [user?.id, userDetails, isFetchingDetails, dispatch])

  useEffect(() => {
    const sessionUser = buildHv3SessionUser(user, userDetails)
    window.__CLIENT_DESIGN_SESSION_USER__ = sessionUser
    window.dispatchEvent(
      new CustomEvent("client-design-session-user", { detail: sessionUser })
    )
  }, [user, userDetails])
}
