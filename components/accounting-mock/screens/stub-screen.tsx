"use client"

import Link from "next/link"
import { Construction } from "lucide-react"
import { AcCard } from "@/components/accounting-mock/primitives"

export function AcStubScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="p-5 max-w-2xl">
      <AcCard className="p-8 text-center">
        <Construction className="h-8 w-8 text-[#2563EB] mx-auto mb-3" />
        <h1 className="text-[18px] font-bold text-[#0B1739]">{title}</h1>
        <p className="mt-2 text-[13px] text-[#6B7280]">
          {subtitle ?? "Pixel mock pending — navigate from Command Centre or wait for the next crop."}
        </p>
        <Link href="/accounting-v2" className="inline-block mt-4 text-[12px] font-semibold text-[#2563EB] hover:underline">
          ← Back to Command Centre
        </Link>
      </AcCard>
    </div>
  )
}
