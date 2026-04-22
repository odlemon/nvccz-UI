"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, DollarSign, FileText, Download, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { applicationsApi } from "@/lib/api/applications-api"
import { format } from "date-fns"

interface ActivityApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  onSuccess?: () => void
}

export function ActivityApprovalModal({ isOpen, onClose, activityId, onSuccess }: ActivityApprovalModalProps) {
  const [loading, setLoading] = useState(false)
  const [activityData, setActivityData] = useState<any>(null)
  const [comments, setComments] = useState('')
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    if (isOpen && activityId) {
      loadActivityData()
    }
  }, [isOpen, activityId])

  const loadActivityData = async () => {
    try {
      setLoading(true)
      const response = await applicationsApi.getActivityForApproval(activityId)
      setActivityData(response.data)
    } catch (error: any) {
      toast.error('Failed to load activity data', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (approved: boolean) => {
    if (!comments.trim() && !approved) {
      toast.error('Please provide rejection comments')
      return
    }

    try {
      setApproving(true)
      await applicationsApi.approveActivity(activityId, {
        approved,
        comments: comments.trim() || (approved ? 'Approved' : 'Rejected')
      })
      
      toast.success(approved ? 'Activity approved successfully' : 'Activity rejected', {
        description: approved ? 'The activity has been approved.' : 'The activity has been rejected.'
      })
      
      setComments('')
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error('Failed to process approval', { description: error.message })
    } finally {
      setApproving(false)
    }
  }

  const parseDocuments = (description: string) => {
    try {
      const match = description.match(/\[DOCUMENTS:(.*?)\]/s)
      if (match && match[1]) {
        return JSON.parse(match[1])
      }
    } catch (error) {
      console.error('Error parsing documents:', error)
    }
    return []
  }

  const cleanDescription = (description: string) => {
    return description.replace(/\[DOCUMENTS:.*?\]/s, '').trim()
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!activityData) return null

  const documents = parseDocuments(activityData.description || '')
  const displayDescription = cleanDescription(activityData.description || '')
  const hasMonetaryValue = activityData.monetaryValueAchieved && parseFloat(activityData.monetaryValueAchieved) > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-5xl max-h-[92vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <CheckCircle className="w-5 h-5 text-blue-500" />
            Review Activity
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Review and approve or reject this activity submission
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Activity Details */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm font-normal text-gray-600">Activity Title</Label>
                <p className="text-base font-medium mt-1">{activityData.title}</p>
              </div>

              <div>
                <Label className="text-sm font-normal text-gray-600">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{displayDescription}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-normal text-gray-600">Submitted By</Label>
                  <p className="text-sm font-medium mt-1">
                    {activityData.user?.firstName} {activityData.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{activityData.user?.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-normal text-gray-600">Submitted On</Label>
                  <p className="text-sm font-medium mt-1">
                    {format(new Date(activityData.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-normal text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge variant={activityData.approvalStatus === 'PENDING' ? 'secondary' : 'default'}>
                    {activityData.approvalStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monetary Value */}
          {hasMonetaryValue && (
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <Label className="text-sm font-normal text-gray-600">Monetary Value Achieved</Label>
                    <p className="text-xl font-semibold text-green-600">
                      ${parseFloat(activityData.monetaryValueAchieved).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <Label className="text-sm font-normal">Attached Documents ({documents.length})</Label>
                </div>
                <div className="space-y-2">
                  {documents.map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 break-all">{doc.fileName}</p>
                          <p className="text-xs text-gray-600">{(doc.fileSize / 1024).toFixed(2)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => window.open(doc.fileUrl, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4 text-purple-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="pt-6 space-y-2">
              <Label htmlFor="comments" className="text-sm font-normal">
                Comments {activityData.approvalStatus === 'PENDING' && '(Required for rejection)'}
              </Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Enter your review comments..."
                rows={4}
                className="rounded-lg"
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={approving}
            className="rounded-full"
          >
            Cancel
          </Button>
          {activityData.approvalStatus === 'PENDING' && (
            <>
              <Button
                variant="outline"
                onClick={() => handleApprove(false)}
                disabled={approving}
                className="rounded-full border-red-500 text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => handleApprove(true)}
                disabled={approving}
                className="rounded-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
              >
                {approving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Activity
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
