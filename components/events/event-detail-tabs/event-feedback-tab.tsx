"use client"

import { useAppSelector } from "@/lib/store"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CiStar } from "react-icons/ci"
import { format } from "date-fns"

interface EventFeedbackTabProps {
  eventId: string
}

export function EventFeedbackTab({ eventId }: EventFeedbackTabProps) {
  const { currentEventFeedback } = useAppSelector((state) => state.events)

  const averageRating = currentEventFeedback.length > 0
    ? currentEventFeedback.reduce((sum, f) => sum + f.rating, 0) / currentEventFeedback.length
    : 0

  const averageSatisfaction = currentEventFeedback.length > 0
    ? currentEventFeedback.reduce((sum, f) => sum + f.overallSatisfaction, 0) / currentEventFeedback.length
    : 0

  const wouldAttendAgain = currentEventFeedback.filter((f) => f.wouldAttendAgain).length
  const wouldRecommend = currentEventFeedback.filter((f) => f.wouldRecommend).length

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <CiStar
            key={star}
            size={16}
            className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Feedback Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Feedback</div>
            <div className="text-2xl font-semibold mt-1">{currentEventFeedback.length}</div>
            <div className="text-xs text-muted-foreground mt-1">Responses received</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Average Rating</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-2xl font-semibold">{averageRating.toFixed(1)}</div>
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Out of 5.0</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Would Attend Again</div>
            <div className="text-2xl font-semibold mt-1 text-green-600">
              {currentEventFeedback.length > 0
                ? `${((wouldAttendAgain / currentEventFeedback.length) * 100).toFixed(0)}%`
                : "0%"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{wouldAttendAgain} respondents</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Would Recommend</div>
            <div className="text-2xl font-semibold mt-1 text-blue-600">
              {currentEventFeedback.length > 0
                ? `${((wouldRecommend / currentEventFeedback.length) * 100).toFixed(0)}%`
                : "0%"}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{wouldRecommend} respondents</div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Categories */}
      {currentEventFeedback.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rating Breakdown</h3>
          <div className="space-y-4">
            {[
              { key: "overallSatisfaction", label: "Overall Satisfaction" },
              { key: "contentQuality", label: "Content Quality" },
              { key: "venueQuality", label: "Venue Quality" },
              { key: "foodQuality", label: "Food Quality" },
              { key: "organization", label: "Organization" }
            ].map((category) => {
              const ratings = currentEventFeedback
                .map((f) => f[category.key as keyof typeof f])
                .filter((r) => typeof r === "number") as number[]
              const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{category.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{avg.toFixed(1)}</span>
                      {renderStars(Math.round(avg))}
                    </div>
                  </div>
                  <Progress value={(avg / 5) * 100} className="h-2" />
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Individual Feedback */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Individual Feedback</h3>
        <div className="space-y-4">
          {currentEventFeedback.map((feedback) => (
            <Card key={feedback.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-semibold text-primary">{feedback.rating}</div>
                  {renderStars(feedback.rating)}
                  {feedback.anonymous && (
                    <Badge variant="outline" className="ml-2">
                      Anonymous
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(feedback.createdAt), "MMM dd, yyyy")}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {feedback.positiveAspects && (
                  <div>
                    <div className="font-semibold text-green-700 mb-1">What Went Well</div>
                    <p className="text-muted-foreground">{feedback.positiveAspects}</p>
                  </div>
                )}

                {feedback.areasForImprovement && (
                  <div>
                    <div className="font-semibold text-yellow-700 mb-1">Areas for Improvement</div>
                    <p className="text-muted-foreground">{feedback.areasForImprovement}</p>
                  </div>
                )}

                {feedback.suggestions && (
                  <div>
                    <div className="font-semibold text-blue-700 mb-1">Suggestions</div>
                    <p className="text-muted-foreground">{feedback.suggestions}</p>
                  </div>
                )}

                {feedback.additionalComments && (
                  <div>
                    <div className="font-semibold mb-1">Additional Comments</div>
                    <p className="text-muted-foreground">{feedback.additionalComments}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Would attend again:</span>
                    <Badge variant={feedback.wouldAttendAgain ? "default" : "outline"}>
                      {feedback.wouldAttendAgain ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Would recommend:</span>
                    <Badge variant={feedback.wouldRecommend ? "default" : "outline"}>
                      {feedback.wouldRecommend ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {currentEventFeedback.length === 0 && (
            <Card className="p-12">
              <div className="text-center">
                <CiStar size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No feedback received yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Feedback will appear here once attendees submit their responses
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
