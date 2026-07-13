"use client"

export function FpaAuditLogs() {
  return (
    <div className="p-6 md:p-8 max-w-[900px]">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#6b7c74]">Audit</p>
      <h1 className="text-3xl font-semibold tracking-tight text-[#14201c] mt-1">Audit logs</h1>
      <p className="text-sm text-[#5c6b64] mt-2">Every material edit, approval, and lock attempt will appear here.</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#d5d2c8] bg-white/50 p-8 text-center text-sm text-[#6b7c74]">
        No audit entries — connect `/v1/fpa` audit endpoints.
      </div>
    </div>
  )
}
