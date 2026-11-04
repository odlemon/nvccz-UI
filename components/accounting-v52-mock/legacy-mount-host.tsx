"use client"

import { useEffect, type ReactNode } from "react"
import { useDispatch } from "react-redux"
import { fetchCurrencies } from "@/lib/store/slices/accountingSlice"
import type { AppDispatch } from "@/lib/store/store"

/**
 * Host for the restored legacy screens that are portalled into the V52 shell (#ac52LegacyLedgerSlot on the
 * General Ledger, #ac52LegacyDashboardSlot on the Command Centre). On the standalone legacy routes these
 * screens sit inside <AccountingLayout>, which dispatches fetchCurrencies() for every accounting page; the
 * shell replaces that layout, so nothing populated the currency list and <CurrencyFilter/> — which returns
 * null while the list is empty — silently disappeared from the ledger filter row, taking multi-currency
 * amounts and the currencyId filter param with it. Re-establishing that one layout effect here keeps the
 * portalled screen functionally identical to its legacy route.
 */
export function LegacyMountHost({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(fetchCurrencies())
  }, [dispatch])

  return <>{children}</>
}
