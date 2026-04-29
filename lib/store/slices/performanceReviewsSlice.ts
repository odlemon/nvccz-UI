import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  performanceReviewsApi,
  ReviewCycle,
  ReviewSummary,
  ReviewDetail,
  ReviewPillarFeedback,
  ReviewStage,
  RatingDistribution,
} from "@/lib/api/performance-reviews-api"

interface PerformanceReviewsState {
  cycles: ReviewCycle[]
  myReviews: ReviewSummary[]
  reviewsToComplete: ReviewSummary[]
  currentReview: ReviewDetail | null
  ratingDistribution: RatingDistribution[]
  loading: boolean
  saving: boolean
  error: string | null
}

const initialState: PerformanceReviewsState = {
  cycles: [],
  myReviews: [],
  reviewsToComplete: [],
  currentReview: null,
  ratingDistribution: [],
  loading: false,
  saving: false,
  error: null,
}

export const fetchReviewCycles = createAsyncThunk("reviews/fetchCycles", async () => {
  const res = await performanceReviewsApi.getCycles()
  // res is the body: { success: true, data: { cycles: [...] } }
  return res.data.cycles || res.data || []
})

export const createReviewCycle = createAsyncThunk(
  "reviews/createCycle",
  async (data: any) => {
    const res = await performanceReviewsApi.createCycle(data)
    return res.data
  }
)

export const fetchMyReviews = createAsyncThunk("reviews/fetchMy", async () => {
  const res = await performanceReviewsApi.getMyReviews()
  // res is the body: { success: true, data: { reviews: [...] } }
  return res.data.reviews || res.data || []
})

export const fetchReviewsToComplete = createAsyncThunk(
  "reviews/fetchToComplete",
  async () => {
    const res = await performanceReviewsApi.getReviewsToComplete()
    // res is the body: { success: true, data: { reviews: [...] } }
    return res.data.reviews || res.data || []
  }
)

export const fetchReview = createAsyncThunk("reviews/fetchOne", async (id: string) => {
  const res = await performanceReviewsApi.getReview(id)
  return res.data
})

export const submitReviewStage = createAsyncThunk(
  "reviews/submitStage",
  async ({
    id,
    stage,
    pillarFeedback,
  }: {
    id: string
    stage: ReviewStage
    pillarFeedback: ReviewPillarFeedback[]
  }) => {
    const res = await performanceReviewsApi.submitStage(id, { stage, pillarFeedback })
    return res.data
  }
)

export const finalizeReview = createAsyncThunk(
  "reviews/finalize",
  async (id: string) => {
    const res = await performanceReviewsApi.finalizeReview(id)
    return res.data
  }
)

export const fetchRatingDistribution = createAsyncThunk(
  "reviews/ratingDistribution",
  async (filters: { organizationWide?: boolean; departmentName?: string } | undefined) => {
    const res = await performanceReviewsApi.getRatingDistribution(filters)
    return res.data.distribution || []
  }
)

const slice = createSlice({
  name: "performanceReviews",
  initialState,
  reducers: {
    clearCurrentReview(state) {
      state.currentReview = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewCycles.fulfilled, (state, action) => {
        state.cycles = action.payload
      })
      .addCase(createReviewCycle.fulfilled, (state, action) => {
        if (action.payload) state.cycles.unshift(action.payload)
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myReviews = action.payload
      })
      .addCase(fetchReviewsToComplete.fulfilled, (state, action) => {
        state.reviewsToComplete = action.payload
      })
      .addCase(fetchReview.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchReview.fulfilled, (state, action) => {
        state.loading = false
        state.currentReview = action.payload || null
      })
      .addCase(fetchReview.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || "Failed to load review"
      })
      .addCase(submitReviewStage.pending, (state) => {
        state.saving = true
      })
      .addCase(submitReviewStage.fulfilled, (state, action) => {
        state.saving = false
        state.currentReview = action.payload || state.currentReview
      })
      .addCase(submitReviewStage.rejected, (state, action) => {
        state.saving = false
        state.error = action.error.message || "Submit failed"
      })
      .addCase(finalizeReview.fulfilled, (state, action) => {
        state.currentReview = action.payload || state.currentReview
      })
      .addCase(fetchRatingDistribution.fulfilled, (state, action) => {
        state.ratingDistribution = action.payload
      })
  },
})

export const { clearCurrentReview } = slice.actions
export default slice.reducer
