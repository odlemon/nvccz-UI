"use client"

export function FundraisingComingSoon({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#141414]">Fundraising & Investor Relations</p>
      <h1 className="text-2xl font-semibold tracking-tight text-[#000000] mt-1">{title}</h1>
      <p className="text-sm text-[#111111] mt-2 leading-relaxed">{description}</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-sm text-[#111111]">
        Navigation shell ready — screens will be built next from the SRD and UI inspiration.
      </div>
    </div>
  )
}
