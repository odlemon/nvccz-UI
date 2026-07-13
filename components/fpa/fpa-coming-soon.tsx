"use client"

export function FpaComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-semibold text-[#0f172a]">{title}</h1>
      <p className="text-sm text-[#64748b] mt-2">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#64748b]">
        Screen shell ready — connect `/v1/fpa` APIs to enable live data.
      </div>
    </div>
  )
}
