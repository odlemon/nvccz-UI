"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, GripVertical, Plus, Send } from "lucide-react"
import { toast } from "sonner"
import { EhButton, EhCard, EhPill } from "@/components/employee-hub-mock/primitives"

const blocks = ["Opening note", "Highlight", "Quote", "Image", "CTA"]

export function NewsletterEditorScreen() {
  const router = useRouter()
  const [stage, setStage] = useState("Draft")
  const [title, setTitle] = useState("Arcus Weekly — Draft issue")
  const [contentBlocks, setContentBlocks] = useState(["Opening note", "Five ideas", "People moves"])

  return (
    <div className="p-4 lg:p-5">
      <button type="button" onClick={() => router.push("/employee-hub/newsletters")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0EA5B7] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to newsletters
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="text-[22px] font-bold text-[#0F172A] bg-transparent outline-none w-full max-w-xl" />
          <div className="flex gap-2 mt-2">
            {["Draft", "In review", "Scheduled"].map((s) => (
              <button key={s} type="button" onClick={() => setStage(s)} className={`px-3 py-1 rounded-full text-[11px] font-bold ${stage === s ? "bg-[#0F172A] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <EhButton variant="outline" onClick={() => toast.success("Saved draft")}>Save</EhButton>
          <EhButton onClick={() => toast.success("Sent for review")}><Send className="h-4 w-4" /> Submit review</EhButton>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <EhCard className="lg:col-span-3 p-3">
          <p className="text-[12px] font-bold text-[#0F172A] mb-2">Content blocks</p>
          {blocks.map((b) => (
            <button key={b} type="button" onClick={() => setContentBlocks((p) => [...p, b])} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[12px] font-medium text-[#334155] hover:bg-[#F7F6F3]">
              <Plus className="h-3.5 w-3.5" /> {b}
            </button>
          ))}
        </EhCard>
        <EhCard className="lg:col-span-6 p-4 min-h-[360px]">
          <p className="text-[12px] font-bold text-[#64748B] mb-3">Editor</p>
          {contentBlocks.map((b, i) => (
            <div key={`${b}-${i}`} className="flex items-start gap-2 mb-3 p-3 rounded-xl border border-[#E8E6E1] bg-[#FAFAF9]">
              <GripVertical className="h-4 w-4 text-[#94A3B8] mt-0.5 shrink-0" />
              <div>
                <EhPill>{b}</EhPill>
                <p className="mt-2 text-[13px] text-[#334155]">Edit {b.toLowerCase()} content here…</p>
              </div>
            </div>
          ))}
        </EhCard>
        <EhCard className="lg:col-span-3 p-4">
          <p className="text-[12px] font-bold text-[#0F172A] mb-3">Audience & controls</p>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Audience</label>
          <select className="w-full h-9 rounded-xl border border-[#E8E6E1] text-sm px-2 mb-3">
            <option>All employees</option>
            <option>Investments</option>
            <option>Leadership</option>
          </select>
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Reviewer</label>
          <select className="w-full h-9 rounded-xl border border-[#E8E6E1] text-sm px-2">
            <option>Communications team</option>
            <option>People Ops</option>
          </select>
        </EhCard>
      </div>
    </div>
  )
}
