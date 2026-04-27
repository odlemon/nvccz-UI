'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/lib/store'
import { getRFQClarifications, postRFQClarification } from '@/lib/store/slices/procurementV2Slice'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, MessageSquare, Send, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface RFQClarificationsProps {
  rfqId: string
}

export function RFQClarifications({ rfqId }: RFQClarificationsProps) {
  const dispatch = useAppDispatch()
  const { rfqClarifications } = useAppSelector((state) => state.procurementV2)
  const [loading, setLoading] = useState(false)
  const [replying, setReplying] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [staffMessage, setStaffMessage] = useState('')
  const [postingStaffMessage, setPostingStaffMessage] = useState(false)

  useEffect(() => {
    setLoading(true)
    dispatch(getRFQClarifications(rfqId)).finally(() => setLoading(false))
  }, [rfqId, dispatch])

  const handleSubmitReply = async (clarificationId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply')
      return
    }

    setSubmitting(true)
    try {
      await dispatch(
        postRFQClarification({
          rfqId,
          clarificationId,
          answer: replyText,
        })
      ).unwrap()

      setReplyText('')
      setReplying(null)
      toast.success('Reply posted successfully')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to post reply'
      toast.error('Failed to post reply', { description })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostStaffMessage = async () => {
    if (!staffMessage.trim()) {
      toast.error('Please enter a clarification message')
      return
    }

    setPostingStaffMessage(true)
    try {
      await dispatch(
        postRFQClarification({
          rfqId,
          answer: staffMessage,
        })
      ).unwrap()

      setStaffMessage('')
      toast.success('Clarification posted to all vendors')
    } catch (error: any) {
      const description = typeof error === 'string' ? error : error?.message || 'Failed to post clarification'
      toast.error('Failed to post clarification', { description })
    } finally {
      setPostingStaffMessage(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Staff-Initiated Clarification Form */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-normal flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            Post a Clarification to All Vendors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Type a clarification or instruction for all vendors..."
            value={staffMessage}
            onChange={(e) => setStaffMessage(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handlePostStaffMessage}
            disabled={postingStaffMessage || !staffMessage.trim()}
            className="gap-2"
          >
            {postingStaffMessage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send size={16} />
                Post to All Vendors
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Clarifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare size={20} />
            Clarifications {rfqClarifications && rfqClarifications.length > 0 && `(${rfqClarifications.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!rfqClarifications || rfqClarifications.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No vendor clarification requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rfqClarifications.map((clarification) => (
          <div key={clarification.id} className="border rounded-lg p-4 space-y-3">
            {/* Question */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{clarification.vendorName}</p>
                  <p className="text-sm text-gray-600">{format(new Date(clarification.askedAt), 'PPp')}</p>
                </div>
                {clarification.answer ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Answered</Badge>
                ) : (
                  <Badge variant="outline" className="border-yellow-200 bg-yellow-50 text-yellow-700">
                    Pending
                  </Badge>
                )}
              </div>
              <p className="text-gray-800 mt-2 bg-gray-50 p-3 rounded">{clarification.question}</p>
            </div>

            {/* Answer */}
            {clarification.answer ? (
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm text-gray-600 mb-1">
                  Answered by {clarification.answeredBy} on {format(new Date(clarification.answeredAt!), 'PPp')}
                </p>
                <p className="text-gray-800">{clarification.answer}</p>
              </div>
            ) : replying === clarification.id ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Type your response here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleSubmitReply(clarification.id)}
                    disabled={submitting}
                    size="sm"
                    className="gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Post Reply
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setReplying(null)
                      setReplyText('')
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setReplying(clarification.id)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Send size={16} />
                Reply to Question
              </Button>
            )}
          </div>
        ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
