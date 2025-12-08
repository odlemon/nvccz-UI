"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle, XCircle, HelpCircle, Calendar } from "lucide-react"
import { toast } from "sonner"
import { eventsApi } from "@/lib/api/events-api"
import Image from "next/image"

interface RSVPPageProps {
  token: string
  initialStatus: 'accepted' | 'declined' | 'maybe' | null
}

export function RSVPPage({ token, initialStatus }: RSVPPageProps) {
  const [submitting, setSubmitting] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'ACCEPTED' | 'DECLINED' | 'MAYBE' | null>(null)
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState(false)
  const [responseData, setResponseData] = useState<any>(null)

  useEffect(() => {
    if (initialStatus) {
      const statusMap = {
        'accepted': 'ACCEPTED',
        'declined': 'DECLINED',
        'maybe': 'MAYBE'
      } as const
      const status = statusMap[initialStatus]
      setSelectedStatus(status)
    }
  }, [initialStatus])

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error('Please select a response')
      return
    }

    try {
      setSubmitting(true)
      const response = await eventsApi.respondToRSVP(token, {
        rsvpStatus: selectedStatus,
        notes: notes.trim() || undefined
      })

      if (response.success && response.data) {
        setResponseData(response.data)
        setSuccess(true)
        toast.success('RSVP submitted successfully', {
          description: `You have ${selectedStatus.toLowerCase()} the invitation`
        })
      } else {
        throw new Error(response.message || 'Failed to submit RSVP')
      }
    } catch (err: any) {
      toast.error('Failed to submit RSVP', { 
        description: err.message || 'Please try again or contact the event organizer' 
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return <CheckCircle className="w-16 h-16 text-green-600" />
      case 'DECLINED':
        return <XCircle className="w-16 h-16 text-red-600" />
      case 'MAYBE':
        return <HelpCircle className="w-16 h-16 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          title: 'You\'re In!',
          description: 'Your attendance has been confirmed',
          bgClass: 'from-green-50 via-white to-emerald-50'
        }
      case 'DECLINED':
        return {
          title: 'Response Recorded',
          description: 'We\'ve noted that you can\'t make it',
          bgClass: 'from-red-50 via-white to-orange-50'
        }
      case 'MAYBE':
        return {
          title: 'Response Received',
          description: 'We\'ve recorded your tentative response',
          bgClass: 'from-yellow-50 via-white to-amber-50'
        }
      default:
        return {
          title: 'Thank You',
          description: 'Your response has been recorded',
          bgClass: 'from-blue-50 via-white to-indigo-50'
        }
    }
  }

  if (success && responseData) {
    const statusInfo = getStatusMessage(responseData.rsvpStatus)
    
    return (
      <div className={`min-h-screen bg-gradient-to-br ${statusInfo.bgClass} flex items-center justify-center p-4`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0">
            <CardHeader className="text-center pb-6 pt-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <Calendar className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Status Icon */}
              <div className="flex justify-center mb-4">
                {getStatusIcon(responseData.rsvpStatus)}
              </div>

              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                {statusInfo.title}
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                {statusInfo.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pb-8">
              {/* Response Details */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`font-semibold ${
                    responseData.rsvpStatus === 'ACCEPTED' ? 'text-green-700' :
                    responseData.rsvpStatus === 'DECLINED' ? 'text-red-700' :
                    'text-yellow-700'
                  }`}>
                    {responseData.rsvpStatus}
                  </span>
                </div>
                {responseData.rsvpRespondedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Responded:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(responseData.rsvpRespondedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600 block mb-2">Your message:</span>
                    <p className="text-sm text-gray-900 bg-white rounded-lg p-3">
                      {notes}
                    </p>
                  </div>
                )}
              </div>

              {responseData.rsvpStatus === 'ACCEPTED' && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-sm text-blue-900 text-center">
                    <strong>We look forward to seeing you!</strong><br />
                    You will receive event details and reminders via email.
                  </p>
                </div>
              )}

              <Button
                onClick={() => window.location.href = 'http://app.kyntaro.com'}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-6 pt-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-12 h-12 text-white" />
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Event RSVP
            </CardTitle>
            <CardDescription className="text-base text-gray-600">
              Please confirm your attendance
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* RSVP Options */}
            {!initialStatus && (
              <div className="space-y-3">
                <Label className="text-base font-semibold text-gray-900">
                  Will you attend?
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    type="button"
                    variant={selectedStatus === 'ACCEPTED' ? 'default' : 'outline'}
                    className={`h-auto py-4 flex items-center justify-center gap-3 rounded-xl transition-all ${
                      selectedStatus === 'ACCEPTED'
                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                        : 'border-2 hover:border-green-500 hover:bg-green-50'
                    }`}
                    onClick={() => setSelectedStatus('ACCEPTED')}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Accept</div>
                      <div className="text-xs opacity-80">I'll be there</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={selectedStatus === 'MAYBE' ? 'default' : 'outline'}
                    className={`h-auto py-4 flex items-center justify-center gap-3 rounded-xl transition-all ${
                      selectedStatus === 'MAYBE'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600'
                        : 'border-2 hover:border-yellow-500 hover:bg-yellow-50'
                    }`}
                    onClick={() => setSelectedStatus('MAYBE')}
                  >
                    <HelpCircle className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Maybe</div>
                      <div className="text-xs opacity-80">Not sure yet</div>
                    </div>
                  </Button>

                  <Button
                    type="button"
                    variant={selectedStatus === 'DECLINED' ? 'default' : 'outline'}
                    className={`h-auto py-4 flex items-center justify-center gap-3 rounded-xl transition-all ${
                      selectedStatus === 'DECLINED'
                        ? 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                        : 'border-2 hover:border-red-500 hover:bg-red-50'
                    }`}
                    onClick={() => setSelectedStatus('DECLINED')}
                  >
                    <XCircle className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Decline</div>
                      <div className="text-xs opacity-80">Can't make it</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Show selected status if from URL */}
            {initialStatus && selectedStatus && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  {selectedStatus === 'ACCEPTED' && <CheckCircle className="w-6 h-6 text-green-600" />}
                  {selectedStatus === 'DECLINED' && <XCircle className="w-6 h-6 text-red-600" />}
                  {selectedStatus === 'MAYBE' && <HelpCircle className="w-6 h-6 text-yellow-600" />}
                  <div>
                    <p className="font-semibold text-gray-900">
                      You're responding: <span className={
                        selectedStatus === 'ACCEPTED' ? 'text-green-600' :
                        selectedStatus === 'DECLINED' ? 'text-red-600' :
                        'text-yellow-600'
                      }>{selectedStatus}</span>
                    </p>
                    <p className="text-sm text-gray-600">Add an optional message below</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold text-gray-900">
                Message (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any message for the organizer..."
                rows={4}
                className="resize-none rounded-xl"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!selectedStatus || submitting}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Response'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>Having trouble? Contact the event organizer</p>
        </div>
      </motion.div>
    </div>
  )
}
