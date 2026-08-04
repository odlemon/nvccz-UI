"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Paperclip, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { EhAvatar, EhButton, EhCard, EhPill } from "@/components/employee-hub-mock/primitives"
import { ehForumThread, ehForums } from "@/lib/employee-hub-mock/fixtures"

export function ForumThreadScreen({ id }: { id: string }) {
  const router = useRouter()
  const meta = ehForums.find((f) => f.id === id) ?? ehForums[0]
  const [posts, setPosts] = useState(ehForumThread.posts)
  const [reply, setReply] = useState("")

  return (
    <div className="p-4 lg:p-5 max-w-[900px] mx-auto">
      <button type="button" onClick={() => router.push("/employee-hub/forums")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0EA5B7] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to forums
      </button>
      <EhPill tone="cyan">{meta.space}</EhPill>
      <h1 className="mt-2 text-[24px] font-bold text-[#0F172A]">{meta.title}</h1>
      <p className="text-sm text-[#64748B] mt-1">{meta.replies} replies · {meta.views} views</p>

      <div className="mt-6 space-y-4">
        {posts.map((p) => (
          <EhCard key={p.id} className="p-4">
            <div className="flex items-start gap-3">
              <EhAvatar initials={p.author.split(" ").map((n) => n[0]).join("").slice(0, 2)} size="sm" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[14px] font-bold text-[#0F172A]">{p.author}</p>
                  <span className="text-[11px] text-[#94A3B8]">{p.role} · {p.time}</span>
                  {p.accepted && (
                    <EhPill tone="success"><CheckCircle2 className="h-3 w-3" /> Accepted insight</EhPill>
                  )}
                </div>
                <p className="mt-2 text-[14px] text-[#334155] leading-relaxed">{p.body}</p>
                <div className="mt-3 flex gap-3">
                  <button type="button" className="text-[12px] font-semibold text-[#64748B] inline-flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" /> Helpful</button>
                  <button type="button" className="text-[12px] font-semibold text-[#64748B] inline-flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" /> Attach</button>
                </div>
              </div>
            </div>
          </EhCard>
        ))}
      </div>

      <EhCard className="mt-6 p-4">
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add to the discussion…" className="w-full min-h-[100px] rounded-xl border border-[#E8E6E1] p-3 text-sm outline-none focus:border-[#0EA5B7]" />
        <div className="mt-3 flex justify-end">
          <EhButton
            onClick={() => {
              if (!reply.trim()) return
              setPosts((prev) => [...prev, { id: `p${prev.length}`, author: "Aisha Ubuntu", role: "Investment Analyst", time: "Just now", body: reply, accepted: false }])
              setReply("")
              toast.success("Reply posted")
            }}
          >
            Post reply
          </EhButton>
        </div>
      </EhCard>
    </div>
  )
}
