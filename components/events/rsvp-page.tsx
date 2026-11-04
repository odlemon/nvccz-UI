"use client"

import { ChangeEvent, FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2, Plus, Upload, CircleCheck } from "lucide-react"
import { toast } from "sonner"
import { eventsApi } from "@/lib/api/events-api"

interface RSVPPageProps { token: string; initialStatus: "accepted" | "declined" | "maybe" | null }

export function RSVPPage({ token }: RSVPPageProps) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [success, setSuccess] = useState(false)
  const [video, setVideo] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [videoConsent, setVideoConsent] = useState(false)
  const [message, setMessage] = useState("")
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!video) { setVideoPreview(null); return }
    const url = URL.createObjectURL(video)
    setVideoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [video])

  useEffect(() => {
    eventsApi.getPublicRSVPDetails(token).then((res) => {
      if (res.success) {
        setDetails(res.data)
        if (res.data.anniversaryVideoUrl) setUploadedVideoUrl(res.data.anniversaryVideoUrl)
        if (res.data.videoConsentAt) setVideoConsent(true)
      }
      else toast.error(res.message || "This registration link is invalid")
    }).catch(() => toast.error("Unable to load this invitation")).finally(() => setLoading(false))
  }, [token])

  const onVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideo(null)
    setUploadedVideoUrl(null)
    const file = event.target.files?.[0]
    if (!file) { setVideo(null); return }
    if (!/\.(mp4|mov)$/i.test(file.name)) { toast.error("Choose an MP4 or MOV video"); event.target.value = ""; return }
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be 50 MB or smaller"); event.target.value = ""; return }
    const objectUrl = URL.createObjectURL(file)
    const probe = document.createElement("video")
    probe.preload = "metadata"
    probe.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl)
      if (probe.duration > 60) { toast.error("Video must be 60 seconds or shorter"); event.target.value = ""; return }
      setVideo(file)
    }
    probe.onerror = () => { URL.revokeObjectURL(objectUrl); toast.error("Could not read this video file"); event.target.value = "" }
    probe.src = objectUrl
  }

  const uploadVideo = async () => {
    if (!video) { toast.error("Choose a video first"); return }
    if (!videoConsent) { toast.error("Please agree to the video consent notice"); return }
    const data = new FormData()
    data.set("video", video)
    data.set("videoConsent", "true")
    setUploadingVideo(true)
    try {
      const res = await eventsApi.uploadPublicRegistrationVideo(token, data)
      if (!res.success || !res.data?.anniversaryVideoUrl) throw new Error(res.message || "Video upload failed")
      setUploadedVideoUrl(res.data.anniversaryVideoUrl)
      toast.success("Video uploaded. Preview it below, then submit your registration.")
    } catch (error: any) { toast.error(error.message || "Video upload failed") }
    finally { setUploadingVideo(false) }
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (video && !uploadedVideoUrl) { toast.error("Upload and preview your video before submitting your registration"); return }
    const formData = new FormData(form)
    formData.set("videoMessage", message)
    formData.set("videoConsent", String(videoConsent))
    setSubmitting(true)
    try {
      const res = await eventsApi.submitPublicRegistration(token, formData)
      if (!res.success) throw new Error(res.message || "Registration failed")
      setSuccess(true)
    } catch (error: any) { toast.error(error.message || "Registration failed") }
    finally { setSubmitting(false) }
  }

  if (loading) return <main className="min-h-screen grid place-items-center bg-[#f5f7f4]"><Loader2 className="h-8 w-8 animate-spin text-[#00843d]" /></main>
  if (!details) return <main className="min-h-screen grid place-items-center bg-[#f5f7f4] p-6"><p className="text-center text-slate-700">This invitation link is invalid or has expired. Please contact the event organizer.</p></main>

  const event = details.event || {}
  const date = new Date(event.startDate)
  const registrationOpen = !event.rsvpDeadline || Date.now() <= new Date(event.rsvpDeadline).getTime()
  const deadlineText = event.rsvpDeadline
    ? new Date(event.rsvpDeadline).toLocaleString("en-GB", { timeZone: "Africa/Harare", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : null

  return <main className="min-h-screen bg-[#f4f6f2] pb-14 font-sans text-[#202623]">
    <section className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">
      <div className="overflow-hidden rounded-t-xl bg-[#052f25]">
        <Image src="/events/zb-gala-registration-hero.png" alt="ZB at 75, stakeholders gala" width={2103} height={748} priority className="h-auto w-full object-cover" />
      </div>
      <div className="bg-white px-6 py-8 shadow-sm sm:px-12">
        {success ? <div className="mx-auto max-w-2xl py-10 text-center">
          <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-[#00843d]" />
          <h1 className="text-3xl font-semibold text-[#00843d]">Thank you for registering</h1>
          <p className="mt-3 text-slate-600">Your details{uploadedVideoUrl ? " and video" : ""} have been received. We look forward to welcoming you.</p>
        </div> : <>
          <p className="text-sm font-semibold uppercase tracking-[.17em] text-[#00843d]">ZB at 75 · Stakeholder Appreciation Gala Dinner</p>
          <h1 className="mt-2 text-3xl font-medium text-[#07382c] sm:text-4xl">Confirm your attendance</h1>
          <div className="mt-5 grid gap-2 border-y border-[#dfe7e1] py-4 text-sm sm:grid-cols-3">
            <p><b>Date</b><br />{Number.isNaN(date.valueOf()) ? "Saturday, 7 November 2026" : date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            <p><b>Guest arrival</b><br />6:30 p.m. for 7:00 p.m.</p>
            <p><b>Venue</b><br />{event.location || "ZB Sports Club"}</p>
          </div>

          {registrationOpen ? <form onSubmit={submit} className="mt-8 space-y-9">
            <section>
              <h2 className="text-[22px] font-medium text-[#202623]">Registration details</h2>
              <p className="mt-2 text-sm text-[#65716a]">Please complete the details below to confirm your attendance.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Full name *" name="name" defaultValue={details.name} required />
                <Field label="Organisation *" name="company" defaultValue={details.company || ""} required />
                <Field label="Email address *" name="email" type="email" defaultValue={details.email} required />
                <Field label="Mobile number *" name="phone" type="tel" defaultValue={details.phone || ""} required />
                <label className="sm:col-span-2"><span className="mb-1.5 block text-sm">Dietary or accessibility requirements</span><textarea name="dietaryRequirements" defaultValue={[details.dietaryRequirements, details.accessibilityNeeds].filter(Boolean).join("; ")} rows={3} className="w-full rounded-md border border-[#d4dcd7] bg-[#f4f6f5] px-3 py-2 outline-none focus:border-[#009e4f] focus:ring-2 focus:ring-[#009e4f]/15" /></label>
              </div>
            </section>

            <section className="border-y border-[#d4dcd7] py-6">
              <h2 className="text-[22px] font-medium text-[#009e4f]">Dress code: 1950s Vintage Elegance</h2>
              <p className="mt-2 text-sm text-[#65716a]">Classic silhouettes, tailored suiting, statement hats, gloves and pearls.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <figure><figcaption className="mb-2 text-sm text-[#65716a]">Women: colour and classic vintage styling</figcaption><Image src="/events/zb-gala-inspiration-women-hd.png" alt="Women’s 1950s vintage elegance inspiration" width={1774} height={887} quality={100} unoptimized className="h-auto w-full" /></figure>
                <figure><figcaption className="mb-2 text-sm text-[#65716a]">Men: formal tailoring and refined period details</figcaption><Image src="/events/zb-gala-inspiration-men-hd.png" alt="Men’s 1950s vintage elegance inspiration" width={1774} height={887} quality={100} unoptimized className="h-auto w-full" /></figure>
              </div>
            </section>

            <section>
              <h2 className="text-[22px] font-medium text-[#009e4f]">Share your ZB@75 message</h2>
          <p className="mt-2 text-sm leading-6">Share a 30–60 second anniversary video.{deadlineText ? ` Please complete your RSVP and video by ${deadlineText} Zimbabwe time.` : " Please complete your RSVP and video by the event RSVP deadline."}</p>
              <textarea aria-label="Anniversary message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Your anniversary message (optional)" className="mt-4 w-full rounded-md border border-[#d4dcd7] bg-[#f4f6f5] px-3 py-2 outline-none focus:border-[#009e4f] focus:ring-2 focus:ring-[#009e4f]/15" />
              <label className="mt-4 flex min-h-[112px] cursor-pointer flex-row items-center gap-5 rounded-md border border-[#60b98a] bg-[#eaf7f0] px-6 py-5 hover:bg-[#def2e7]">
                <Plus className="h-7 w-7 shrink-0 text-[#009e4f]" />
                <span className="flex min-w-0 flex-col"><span className="break-words text-base font-medium text-[#009e4f]">{video ? video.name : "Click to upload your video"}</span>
                <span className="mt-1 text-xs text-slate-600">MP4 or MOV · up to 60 seconds · 50 MB maximum</span>
                </span>
                <input type="file" accept="video/mp4,video/quicktime,.mp4,.mov" className="sr-only" onChange={onVideoChange} />
              </label>
              {videoPreview && <video src={videoPreview} controls playsInline preload="metadata" aria-label="Preview your selected anniversary video" className="mt-4 aspect-video max-h-80 w-full rounded-lg bg-black" />}
              {!videoPreview && uploadedVideoUrl && <video src={uploadedVideoUrl} controls playsInline preload="metadata" aria-label="Preview your uploaded anniversary video" className="mt-4 aspect-video max-h-80 w-full rounded-lg bg-black" />}
              <label className="mt-4 flex items-start gap-3 text-sm leading-6"><input type="checkbox" checked={videoConsent} onChange={(e) => setVideoConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-[#bac8c0] accent-[#009e4f]" />I have read and agree to the video consent notice below.</label>
              {video && <button type="button" onClick={uploadVideo} disabled={uploadingVideo || !videoConsent || Boolean(uploadedVideoUrl)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#009e4f] px-5 py-2 text-sm font-medium text-[#00843d] hover:bg-[#eaf7f0] disabled:cursor-not-allowed disabled:opacity-60">
                {uploadingVideo ? <><Loader2 className="h-4 w-4 animate-spin" />Uploading video…</> : uploadedVideoUrl ? <><CircleCheck className="h-4 w-4" />Video uploaded</> : <><Upload className="h-4 w-4" />Upload video</>}
              </button>}
              <p className="mt-3 text-xs leading-5 text-[#65716a]">By uploading a video, you give ZB permission to use your video, image and voice as part of the stakeholder celebration and on ZB-owned social media pages.</p>
            </section>

            <button type="submit" disabled={submitting || uploadingVideo || Boolean(video && (!videoConsent || !uploadedVideoUrl))} className="min-h-12 w-full rounded-2xl bg-[#009e4f] px-6 py-3 text-base font-medium text-white transition hover:bg-[#00843d] disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" />Submitting…</span> : "Submit registration"}
            </button>
          </form> : <div className="mt-8 rounded bg-[#f5f7f4] p-5">Registration has closed. Please contact the event organizer if you need assistance.</div>}
        </>}
      </div>
      <footer className="bg-[#052f25] px-6 py-5 text-center text-sm text-white">75 years of being for you</footer>
    </section>
  </main>
}

function Field({ label, name, defaultValue, type = "text", required = false }: { label: string; name: string; defaultValue: string; type?: string; required?: boolean }) {
  return <label><span className="mb-1.5 block text-sm">{label}</span><input name={name} type={type} defaultValue={defaultValue} required={required} className="h-11 w-full rounded-md border border-[#d4dcd7] bg-[#f4f6f5] px-3 outline-none focus:border-[#009e4f] focus:ring-2 focus:ring-[#009e4f]/15" /></label>
}
