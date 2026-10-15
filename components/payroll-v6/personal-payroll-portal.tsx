"use client"

import { useEffect, useState } from "react"
import {
  downloadPayslipPdf,
  getMyLeaveBalances,
  getMyPayrollPortal,
  getMyPayslips,
  type Payslip,
} from "@/lib/api/payroll-v6-api"

type PortalState = "loading" | "ready" | "unlinked" | "error"

function errorStatus(error: unknown): number | undefined {
  const e = error as { status?: number; response?: { status?: number } }
  return e?.status ?? e?.response?.status
}

function money(value: unknown, currencyCode?: string): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  try {
    return new Intl.NumberFormat(undefined, {
      style: currencyCode ? "currency" : "decimal",
      currency: currencyCode || undefined,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currencyCode || ""} ${amount.toFixed(2)}`.trim()
  }
}

export function PersonalPayrollPortal() {
  const [status, setStatus] = useState<PortalState>("loading")
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [leaveBalances, setLeaveBalances] = useState<Record<string, any>[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([getMyPayrollPortal(), getMyPayslips(), getMyLeaveBalances()])
      .then(([nextProfile, nextPayslips, nextLeave]) => {
        if (cancelled) return
        setProfile(nextProfile)
        setPayslips(nextPayslips)
        setLeaveBalances(nextLeave)
        setStatus("ready")
      })
      .catch((error: unknown) => {
        if (!cancelled) setStatus(errorStatus(error) === 404 ? "unlinked" : "error")
      })
    return () => { cancelled = true }
  }, [])

  async function download(payslip: Payslip) {
    const id = String(payslip.id || "")
    if (!id) return
    setDownloading(id)
    try {
      const blob = await downloadPayslipPdf(id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `payslip-${id}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setStatus("error")
    } finally {
      setDownloading(null)
    }
  }

  const currency = profile?.currency?.code || profile?.currencyCode

  return (
    <main className="min-h-full bg-slate-50 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Employee self-service</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">My Pay</h1>
          <p className="mt-2 text-sm text-slate-600">Your own payslips and leave balances. Payroll administration is not available in this area.</p>
        </header>
        {status === "loading" && <p role="status" className="rounded-xl border bg-white p-5 text-sm text-slate-600">Loading your payroll information…</p>}
        {status === "unlinked" && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Your staff account is not linked to an employee payroll record yet. No payroll information is available to display.</p>}
        {status === "error" && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">Your personal payroll information could not be loaded. Please try again later.</p>}
        {status === "ready" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Your payroll profile</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-slate-500">Employee number</dt><dd className="mt-1 text-sm font-medium text-slate-900">{profile?.employeeNumber || "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Department</dt><dd className="mt-1 text-sm font-medium text-slate-900">{profile?.departmentCode || profile?.department?.name || "—"}</dd></div>
              </dl>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Your payslips</h2>
              {payslips.length === 0 ? <p className="mt-3 text-sm text-slate-600">No payslips have been issued to you.</p> : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {payslips.map((payslip, index) => {
                    const key = String(payslip.id || index)
                    return <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div><p className="text-sm font-medium text-slate-900">{payslip.periodLabel || payslip.period || payslip.payrollRun?.periodLabel || "Payslip"}</p><p className="mt-1 text-xs text-slate-500">Net pay: {money(payslip.netPay ?? payslip.netSalary, currency)}</p></div>
                      <button type="button" disabled={downloading === key} onClick={() => void download(payslip)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">{downloading === key ? "Preparing…" : "Download"}</button>
                    </li>
                  })}
                </ul>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Your leave balances</h2>
              {leaveBalances.length === 0 ? <p className="mt-3 text-sm text-slate-600">No leave balances are available.</p> : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {leaveBalances.map((leave, index) => <li key={String(leave.id || index)} className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-medium text-slate-900">{leave.leaveType || leave.type || "Leave"}</p><p className="mt-1 text-sm text-slate-600">{leave.balance ?? leave.availableDays ?? "—"} days available</p></li>)}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
