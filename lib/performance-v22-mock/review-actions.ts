import { apiClient } from "@/lib/api/api-client"
import { publishPerformanceLiveData } from "./bridge"

export async function createPerformanceReview(payload: Record<string, unknown>) {
  const response: any = await apiClient.post("/performance-reviews", payload)
  await publishPerformanceLiveData()
  return response?.data
}

export async function createPerformanceReviewCycle(payload: Record<string, unknown>) {
  const response: any = await apiClient.post("/performance/review-cycles", payload)
  await publishPerformanceLiveData()
  return response?.data
}

export async function savePerformanceReview(id: string, payload: Record<string, unknown>) {
  const response: any = await apiClient.put(`/performance-reviews/${encodeURIComponent(id)}`, payload)
  await publishPerformanceLiveData()
  return response?.data
}

export async function savePerformanceSelfAssessment(id: string, payload: Record<string, unknown>, submit = false) {
  await apiClient.put(`/performance-reviews/${encodeURIComponent(id)}/self-assessment`, payload)
  if (submit) await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/submit-self-assessment`, {})
  await publishPerformanceLiveData()
}

export async function completePerformanceReviewStage(id: string) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/complete-stage`, {})
  await publishPerformanceLiveData()
  return response?.data
}

export async function finalizePerformanceReview(id: string) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/finalize`, {})
  await publishPerformanceLiveData()
  return response?.data
}

export async function initiatePerformanceReviewCycle(id: string) {
  const response: any = await apiClient.post(`/performance-reviews/cycles/${encodeURIComponent(id)}/initiate`, {})
  await publishPerformanceLiveData()
  return response?.data
}

export async function populatePerformanceReviewSnapshot(id: string) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/autopopulate`, {})
  await publishPerformanceLiveData()
  return response?.data
}

export async function submitPerformanceReviewFeedback(payload: Record<string, unknown>) {
  const response: any = await apiClient.post("/performance-reviews/feedback", payload)
  await publishPerformanceLiveData()
  return response?.data
}

export async function nominatePerformanceReviewPeers(id: string, nomineeUserIds: string[]) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/peer-nominations`, { nomineeUserIds })
  await publishPerformanceLiveData()
  return response?.data
}

export async function decidePerformanceReviewPeerNomination(nominationId: string, decision: "APPROVED" | "REJECTED") {
  const response: any = await apiClient.post(`/performance-reviews/peer-nominations/${encodeURIComponent(nominationId)}/decision`, { decision })
  await publishPerformanceLiveData()
  return response?.data
}

export async function recordPerformanceReviewMeeting(id: string, meetingAt: string) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/meeting`, { meetingAt })
  await publishPerformanceLiveData()
  return response?.data
}

export async function signOffPerformanceReview(id: string) {
  const response: any = await apiClient.post(`/performance-reviews/${encodeURIComponent(id)}/signoff`, {})
  await publishPerformanceLiveData()
  return response?.data
}

export async function downloadPerformanceReviewDocument(id: string) {
  const response: any = await apiClient.get(`/performance-reviews/${encodeURIComponent(id)}/document.pdf`, { responseType: "blob" } as any)
  return response
}
