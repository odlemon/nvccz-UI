"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, Star, MessageSquare, Calendar } from "lucide-react"
import { toast } from "sonner"
import { eventsApi, type AppEvent } from "@/lib/api/events-api"
import { format } from "date-fns"

interface PublicFeedbackPageProps {
  eventId: string
}

const RATING_DIMENSIONS = [
  { key: "overallSatisfaction", label: "Overall Satisfaction", required: true },
  { key: "contentQuality", label: "Content Quality", required: false },
  { key: "venueQuality", label: "Venue Quality", required: false },
  { key: "foodQuality", label: "Food Quality", required: false },
  { key: "organization", label: "Organization", required: false },
] as const

type RatingKey = typeof RATING_DIMENSIONS[number]["key"]

export function PublicFeedbackPage({ eventId }: PublicFeedbackPageProps) {
  const [event, setEvent] = useState<AppEvent | null>(null)
  const [loadingEvent, setLoadingEvent] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [rating, setRating] = useState<number>(0)
  const [dimensions, setDimensions] = useState<Record<RatingKey, number>>({
    overallSatisfaction: 0,
    contentQuality: 0,
    venueQuality: 0,
    foodQuality: 0,
    organization: 0,
  })
  const [positiveAspects, setPositiveAspects] = useState("")
  const [areasForImprovement, setAreasForImprovement] = useState("")
  const [suggestions, setSuggestions] = useState("")
  const [additionalComments, setAdditionalComments] = useState("")
  const [wouldAttendAgain, setWouldAttendAgain] = useState<boolean | null>(null)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [anonymous, setAnonymous] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await eventsApi.getByIdPublic(eventId)
        if (res.success && res.data) setEvent(res.data)
      } catch {
        // event lookup is best-effort; feedback form still works
      } finally {
        setLoadingEvent(false)
      }
    }
    load()
  }, [eventId])

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please provide an overall rating")
      return
    }
    if (!dimensions.overallSatisfaction) {
      toast.error("Please rate your overall satisfaction")
      return
    }
    if (wouldAttendAgain === null || wouldRecommend === null) {
      toast.error("Please answer would-attend-again and would-recommend")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        rating,
        overallSatisfaction: dimensions.overallSatisfaction,
        contentQuality: dimensions.contentQuality || undefined,
        venueQuality: dimensions.venueQuality || undefined,
        foodQuality: dimensions.foodQuality || undefined,
        organization: dimensions.organization || undefined,
        positiveAspects: positiveAspects.trim() || undefined,
        areasForImprovement: areasForImprovement.trim() || undefined,
        suggestions: suggestions.trim() || undefined,
        additionalComments: additionalComments.trim() || undefined,
        wouldAttendAgain,
        wouldRecommend,
        anonymous,
      }

      const res = await eventsApi.submitFeedbackPublic(eventId, payload)
      if (res.success) {
        setSuccess(true)
        toast.success("Feedback submitted", {
          description: "Thank you for sharing your experience"
        })
      } else {
        throw new Error(res.message || "Submission failed")
      }
    } catch (err: any) {
      toast.error("Failed to submit feedback", {
        description: err.message || "Please try again"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const StarRow = ({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 focus:outline-none"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <Star
            size={size}
            className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        </button>
      ))}
    </div>
  )

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Thank you!
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Your feedback has been recorded and will help us improve future events.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <Button
                onClick={() => (window.location.href = "http://kyntaro.com")}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-full"
              >
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl mx-auto"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Event Feedback
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              {loadingEvent
                ? "Loading event details..."
                : event
                  ? `Share your thoughts about "${event.title}"`
                  : "Share your thoughts about this event"}
            </CardDescription>
            {event && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.startDate), "PPP")}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-8 pb-8">
            {/* Overall rating */}
            <div className="space-y-3 text-center">
              <Label className="text-base font-semibold text-gray-900">
                Overall Rating *
              </Label>
              <div className="flex justify-center">
                <StarRow value={rating} onChange={setRating} size={36} />
              </div>
              <p className="text-sm text-gray-500">
                {rating === 0 ? "Tap a star to rate" : `${rating} of 5`}
              </p>
            </div>

            {/* Dimension ratings */}
            <div className="space-y-4 border-t pt-6">
              <Label className="text-base font-semibold text-gray-900">
                Rate by Category
              </Label>
              {RATING_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="flex items-center justify-between gap-4">
                  <span className="text-sm text-gray-700">
                    {dim.label}
                    {dim.required && " *"}
                  </span>
                  <StarRow
                    value={dimensions[dim.key]}
                    onChange={(v) => setDimensions((prev) => ({ ...prev, [dim.key]: v }))}
                  />
                </div>
              ))}
            </div>

            {/* Open-ended feedback */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="positive" className="text-sm font-medium text-gray-900">
                  What went well?
                </Label>
                <Textarea
                  id="positive"
                  value={positiveAspects}
                  onChange={(e) => setPositiveAspects(e.target.value)}
                  placeholder="Great speakers, good food, well organized..."
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improve" className="text-sm font-medium text-gray-900">
                  What could be improved?
                </Label>
                <Textarea
                  id="improve"
                  value={areasForImprovement}
                  onChange={(e) => setAreasForImprovement(e.target.value)}
                  placeholder="Better signage, longer breaks..."
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suggestions" className="text-sm font-medium text-gray-900">
                  Suggestions
                </Label>
                <Textarea
                  id="suggestions"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Any ideas for future events?"
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>
            </div>

            {/* Yes/No questions */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Would you attend this event again? *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={wouldAttendAgain === true ? "default" : "outline"}
                    onClick={() => setWouldAttendAgain(true)}
                    className={`rounded-full ${wouldAttendAgain === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wouldAttendAgain === false ? "default" : "outline"}
                    onClick={() => setWouldAttendAgain(false)}
                    className={`rounded-full ${wouldAttendAgain === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                  >
                    No
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-900">
                  Would you recommend this event to others? *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={wouldRecommend === true ? "default" : "outline"}
                    onClick={() => setWouldRecommend(true)}
                    className={`rounded-full ${wouldRecommend === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={wouldRecommend === false ? "default" : "outline"}
                    onClick={() => setWouldRecommend(false)}
                    className={`rounded-full ${wouldRecommend === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional comments + anonymous */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="comments" className="text-sm font-medium text-gray-900">
                  Additional Comments
                </Label>
                <Textarea
                  id="comments"
                  value={additionalComments}
                  onChange={(e) => setAdditionalComments(e.target.value)}
                  placeholder="Anything else you'd like to share?"
                  rows={3}
                  className="resize-none rounded-xl"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Submit anonymously</span>
                  <p className="text-xs text-gray-500">Your identity will not be shared with the organizer</p>
                </div>
              </label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Feedback"
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Your response helps us plan better events</p>
        </div>
      </motion.div>
    </div>
  )
}
