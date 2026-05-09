"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertCircle, Users, TrendingUp } from "lucide-react"
import { toast } from "sonner"
import { boardReviewApi, BoardReviewCreateRequest, BoardReviewUpdateRequest } from "@/lib/api/board-review-api"

interface BoardReviewModalProps {
  isOpen: boolean
  onClose: () => void
  applicationId: string
  onSuccess?: () => void
}

export function BoardReviewModal({ isOpen, onClose, applicationId, onSuccess }: BoardReviewModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<BoardReviewCreateRequest>({
    investmentApproved: false,
    investmentRejected: false,
    conditionalApproval: false,
    recommendationReport: '',
    decisionReason: '',
    nextSteps: '',
    overallScore: 0,
    finalComments: ''
  })

  const [existingData, setExistingData] = useState<any>(null)
  const [hasExistingData, setHasExistingData] = useState(false)

  useEffect(() => {
    if (isOpen && applicationId) {
      loadExistingData()
    }
  }, [isOpen, applicationId])

  const loadExistingData = async () => {
    try {
      const response = await boardReviewApi.getByApplicationId(applicationId)
      if (response.success) {
        setExistingData(response.data)
        setHasExistingData(true)
        setFormData({
          investmentApproved: response.data.investmentApproved,
          investmentRejected: response.data.investmentRejected,
          conditionalApproval: response.data.conditionalApproval,
          recommendationReport: response.data.recommendationReport,
          decisionReason: response.data.decisionReason,
          nextSteps: response.data.nextSteps,
          overallScore: parseFloat(response.data.overallScore) || 0,
          finalComments: response.data.finalComments
        })
      }
    } catch (error: any) {
      // If it's a 404 or similar "not found" error, it means no board review exists yet
      if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('No board review data')) {
        setHasExistingData(false)
        setExistingData(null)
        // Reset form to default values for new board review
        setFormData({
          investmentApproved: false,
          investmentRejected: false,
          conditionalApproval: false,
          recommendationReport: '',
          decisionReason: '',
          nextSteps: '',
          overallScore: 0,
          finalComments: ''
        })
      } else {
        console.error('Error loading existing data:', error)
      }
    }
  }

  const handleSubmit = async () => {
    if (!hasExistingData) {
      toast.error('Board review must be initiated first with a memorandum document')
      return
    }

    try {
      setLoading(true)
      // Update existing board review
      const updateData: BoardReviewUpdateRequest = {
        recommendationReport: formData.recommendationReport,
        decisionReason: formData.decisionReason,
        nextSteps: formData.nextSteps,
        overallScore: formData.overallScore,
        finalComments: formData.finalComments
      }
      await boardReviewApi.update(applicationId, updateData)
      toast.success('Board review updated successfully')
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error('Failed to update board review', { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const getDecisionColor = () => {
    if (formData.investmentApproved) return 'text-green-600'
    if (formData.investmentRejected) return 'text-red-600'
    if (formData.conditionalApproval) return 'text-amber-600'
    return 'text-gray-600'
  }

  const getDecisionIcon = () => {
    if (formData.investmentApproved) return <CheckCircle className="w-5 h-5" />
    if (formData.investmentRejected) return <XCircle className="w-5 h-5" />
    if (formData.conditionalApproval) return <AlertCircle className="w-5 h-5" />
    return <AlertCircle className="w-5 h-5" />
  }

  const getDecisionText = () => {
    if (formData.investmentApproved) return 'Approved'
    if (formData.investmentRejected) return 'Rejected'
    if (formData.conditionalApproval) return 'Conditional Approval'
    return 'Pending Decision'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-normal">
            <Users className="w-5 h-5" />
            {hasExistingData ? 'Update Board Review Assessment' : 'Create Board Review Assessment'}
          </DialogTitle>
          <p className="text-gray-600">
            {hasExistingData ? 'Update board evaluation and investment decision' : 'Create board evaluation and investment decision'}
          </p>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          {/* Investment Decision */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Investment Decision</h3>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  {getDecisionIcon()}
                  <span className={getDecisionColor()}>Decision Status</span>
                </CardTitle>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="investmentApproved">Investment Approved</Label>
                  <Switch
                    id="investmentApproved"
                    checked={formData.investmentApproved}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        investmentApproved: checked,
                        investmentRejected: checked ? false : prev.investmentRejected,
                        conditionalApproval: checked ? false : prev.conditionalApproval
                      }))
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="investmentRejected">Investment Rejected</Label>
                  <Switch
                    id="investmentRejected"
                    checked={formData.investmentRejected}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        investmentRejected: checked,
                        investmentApproved: checked ? false : prev.investmentApproved,
                        conditionalApproval: checked ? false : prev.conditionalApproval
                      }))
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label htmlFor="conditionalApproval">Conditional Approval</Label>
                  <Switch
                    id="conditionalApproval"
                    checked={formData.conditionalApproval}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        conditionalApproval: checked,
                        investmentApproved: checked ? false : prev.investmentApproved,
                        investmentRejected: checked ? false : prev.investmentRejected
                      }))
                    }}
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Overall Score */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Assessment Score</h3>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Overall Score
                </CardTitle>
              </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="overallScore">Score (0-100)</Label>
                  <Input
                    id="overallScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, overallScore: parseFloat(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-normal text-blue-600">{formData.overallScore}</div>
                  <Badge variant={formData.overallScore >= 80 ? 'default' : formData.overallScore >= 60 ? 'secondary' : 'destructive'}>
                    {formData.overallScore >= 80 ? 'Excellent' : formData.overallScore >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Recommendation Report */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Recommendation Details</h3>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal">Recommendation Report</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="recommendationReport" className="text-sm font-normal">Detailed Recommendation</Label>
                <Textarea
                  id="recommendationReport"
                  value={formData.recommendationReport}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendationReport: e.target.value }))}
                  placeholder="Enter detailed recommendation report..."
                  rows={4}
                  className="rounded-lg"
                />
              </div>
            </CardContent>
            </Card>
          </div>

          {/* Decision Details */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Decision Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal">Decision Reasoning</CardTitle>
                </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="decisionReason" className="text-sm font-normal">Decision Reason</Label>
                  <Textarea
                    id="decisionReason"
                    value={formData.decisionReason}
                    onChange={(e) => setFormData(prev => ({ ...prev, decisionReason: e.target.value }))}
                    placeholder="Enter the reasoning behind the decision..."
                    rows={3}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-normal">Next Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="nextSteps" className="text-sm font-normal">Next Steps</Label>
                    <Textarea
                      id="nextSteps"
                      value={formData.nextSteps}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextSteps: e.target.value }))}
                      placeholder="Enter the next steps for this application..."
                      rows={3}
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Final Comments */}
          <div className="space-y-4">
            <h3 className="text-base font-normal text-gray-900">Final Assessment</h3>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-normal flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                  Final Comments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="finalComments" className="text-sm font-normal">Board Comments</Label>
                  <Textarea
                    id="finalComments"
                    value={formData.finalComments}
                    onChange={(e) => setFormData(prev => ({ ...prev, finalComments: e.target.value }))}
                    placeholder="Enter final board comments..."
                    rows={4}
                    className="rounded-lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-full">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full"
          >
            {loading ? 'Processing...' : `${hasExistingData ? 'Update' : 'Create'} Board Review`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
