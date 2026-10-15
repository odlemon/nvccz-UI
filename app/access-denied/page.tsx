import Link from "next/link"

const MODULE_NAMES: Record<string, string> = {
  forecasting: "FP&A",
  "procurement-v23": "Procurement",
  "accounting-v52": "Accounting",
  "payroll-v6": "Payroll",
  "portfolio-v11": "Portfolio Management",
}

export default function AccessDeniedPage({
  searchParams,
}: {
  searchParams: { module?: string; submodule?: string; from?: string }
}) {
  const requestedModule = searchParams.module
  const moduleName = requestedModule ? MODULE_NAMES[requestedModule] ?? requestedModule : "this page"

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section
        role="alert"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-amber-50 text-xl font-semibold text-amber-700" aria-hidden="true">
          !
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your account is not authorized to open {moduleName}. If you believe this is incorrect, contact your administrator.
        </p>
        <Link
          href="/home"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700"
        >
          Return to Home
        </Link>
      </section>
    </main>
  )
}
