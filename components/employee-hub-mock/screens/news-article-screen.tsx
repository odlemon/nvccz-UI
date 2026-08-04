"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bookmark, Share2 } from "lucide-react"
import { toast } from "sonner"
import { EhButton, EhCard, EhPill } from "@/components/employee-hub-mock/primitives"
import { ehNewsArticles } from "@/lib/employee-hub-mock/fixtures"

export function NewsArticleScreen({ id }: { id: string }) {
  const router = useRouter()
  const article = ehNewsArticles.find((a) => a.id === id) ?? ehNewsArticles[0]

  return (
    <div className="p-4 lg:p-5 max-w-[900px] mx-auto">
      <button type="button" onClick={() => router.push("/employee-hub/news")} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0EA5B7] mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to News
      </button>
      <div className="h-56 rounded-2xl bg-gradient-to-br from-[#0EA5B7] to-[#0369A1] mb-6" />
      <EhPill tone="cyan">{article.category}</EhPill>
      <h1 className="mt-3 text-[28px] lg:text-[32px] font-bold text-[#0F172A] leading-tight tracking-tight">{article.title}</h1>
      <p className="mt-2 text-sm text-[#64748B]">{article.author} · {article.date} · {article.readMins} min read</p>
      <p className="mt-4 text-[16px] text-[#334155] leading-relaxed font-medium">{article.summary}</p>
      <div className="mt-6 space-y-4 text-[15px] text-[#334155] leading-relaxed">
        {article.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>
      <EhCard className="mt-8 p-4">
        <p className="text-[13px] font-bold text-[#0F172A] mb-2">Related</p>
        <div className="flex flex-wrap gap-2">
          {ehNewsArticles.filter((a) => a.id !== article.id).map((a) => (
            <Link key={a.id} href={`/employee-hub/news/${a.id}`} className="text-[12px] font-semibold text-[#0EA5B7] hover:underline">{a.title}</Link>
          ))}
        </div>
      </EhCard>
      <div className="mt-6 flex gap-2">
        <EhButton variant="outline" onClick={() => toast.success("Saved to reading list")}><Bookmark className="h-4 w-4" /> Save</EhButton>
        <EhButton variant="outline" onClick={() => toast.success("Link copied")}><Share2 className="h-4 w-4" /> Share</EhButton>
      </div>
    </div>
  )
}
