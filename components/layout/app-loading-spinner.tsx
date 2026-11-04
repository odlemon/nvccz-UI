type AppLoadingSpinnerProps = {
  label?: string
  className?: string
}

/** Shared page-level loader for module transitions and route fallbacks. */
export function AppLoadingSpinner({
  label = "Loading module",
  className = "",
}: AppLoadingSpinnerProps) {
  return (
    <div className={`flex h-full min-h-[320px] items-center justify-center ${className}`}>
      <div
        className="relative flex h-12 w-12 items-center justify-center"
        role="status"
        aria-label={label}
        aria-live="polite"
      >
        <span className="absolute h-12 w-12 rounded-full border border-[#DCE6F2]" />
        <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#DCE6F2] border-t-[#2878E5]" />
        <span className="absolute h-1.5 w-1.5 rounded-full bg-[#2878E5]" />
        <span className="sr-only">{label}…</span>
      </div>
    </div>
  )
}
