import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'
import { applicationsApi, ApplicationCreateRequest, Application } from '@/lib/api/applications-api'
import { boardReviewApi } from '@/lib/api/board-review-api'
import { investmentMemoApi, type MemoSections } from '@/lib/api/investment-memo-api'

export interface Document {
  documentType: 'BUSINESS_PLAN' | 'PROOF_OF_CONCEPT' | 'MARKET_RESEARCH' | 'PROJECTED_CASH_FLOWS' | 'HISTORICAL_FINANCIALS'
  fileName: string
  fileUrl: string
  fileSize: number
  isRequired: boolean
  file?: File
}

export interface ApplicationFormData {
  // Step 1: Basic Information
  firstName: string
  lastName: string
  applicantEmail: string
  applicantPhone: string
  phoneCountryCode: string
  applicantAddress: string

  // Step 2: Business Information
  businessName: string
  businessDescription: string
  industry: string
  businessStage: 'STARTUP' | 'GROWTH' | 'MATURE' | 'EXPANSION'
  foundingDate: string
  requestedAmount: number

  // Step 3: Documents
  documents: Document[]

  // Form state
  currentStep: number
  isSubmitting: boolean
  errors: Record<string, string>
  lastResponse?: any
  submitError?: string

  // Applications list state
  applications: Application[]
  isLoading: boolean
  fetchError?: string
  investmentUsers: any[]
  usersLoading: boolean
  // Additional fetched data caches
  dueDiligenceByApp: Record<string, any>
  dueDiligenceLoadingByApp: Record<string, boolean>
  boardReviewByApp: Record<string, any>
  boardReviewLoadingByApp: Record<string, boolean>
  termSheetByApp: Record<string, any>
  termSheetLoadingByApp: Record<string, boolean>
  fundDisbursementByApp: Record<string, any>
  fundDisbursementLoadingByApp: Record<string, boolean>
  voteSummaryByApp: Record<string, any>
  voteSummaryLoadingByApp: Record<string, boolean>
  belowThresholdApplications: Application[]
  belowThresholdLoading: boolean
  latestApplication?: Application
  latestApplicationLoading?: boolean
  investmentImplementationByApp: Record<string, any>
  investmentImplementationLoadingByApp: Record<string, boolean>
  disbursementSummaryByApp: Record<string, any>
  disbursementSummaryLoadingByApp: Record<string, boolean>
  agreedToNDA: boolean

  // Investment Memo Editing
  investmentMemoByApp: Record<string, any>
  investmentMemoLoadingByApp: Record<string, boolean>
  memoVersionsByApp: Record<string, any[]>
  memoVersionsLoadingByApp: Record<string, boolean>
  memoVersionDetailById: Record<string, any>
  memoVersionDetailLoadingById: Record<string, boolean>
  memoApprovalHistoryByApp: Record<string, any[]>
  memoApprovalHistoryLoadingByApp: Record<string, boolean>
  memoSaving: boolean
  memoValidating: boolean
  memoSubmitting: boolean
  memoApproving: boolean
  memoRejecting: boolean
  memoError?: string
}

export const fetchLatestApplicationById = createAsyncThunk(
  'application/fetchLatestApplicationById',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getById(applicationId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch application')
    }
  }
)

const initialState: ApplicationFormData = {
  firstName: '',
  lastName: '',
  applicantEmail: '',
  applicantPhone: '',
  phoneCountryCode: '+263',
  applicantAddress: '',
  businessName: '',
  businessDescription: '',
  industry: '',
  businessStage: 'STARTUP',
  foundingDate: '',
  requestedAmount: 0,
  documents: [],
  currentStep: 1,
  isSubmitting: false,
  errors: {},
  lastResponse: undefined,
  submitError: undefined,
  applications: [],
  isLoading: false,
  fetchError: undefined,
  investmentUsers: [],
  usersLoading: false
  ,
  dueDiligenceByApp: {},
  dueDiligenceLoadingByApp: {},
  boardReviewByApp: {},
  boardReviewLoadingByApp: {},
  termSheetByApp: {},
  termSheetLoadingByApp: {},
  fundDisbursementByApp: {},
  fundDisbursementLoadingByApp: {},
  voteSummaryByApp: {},
  voteSummaryLoadingByApp: {},
  belowThresholdApplications: [],
  belowThresholdLoading: false,
  investmentImplementationByApp: {},
  investmentImplementationLoadingByApp: {},
  disbursementSummaryByApp: {},
  disbursementSummaryLoadingByApp: {},
  agreedToNDA: false,

  investmentMemoByApp: {},
  investmentMemoLoadingByApp: {},
  memoVersionsByApp: {},
  memoVersionsLoadingByApp: {},
  memoVersionDetailById: {},
  memoVersionDetailLoadingById: {},
  memoApprovalHistoryByApp: {},
  memoApprovalHistoryLoadingByApp: {},
  memoSaving: false,
  memoValidating: false,
  memoSubmitting: false,
  memoApproving: false,
  memoRejecting: false,
  memoError: undefined,
}

// Async thunk for submitting application
export const submitApplication = createAsyncThunk(
  'application/submitApplication',
  async (formData: ApplicationFormData, { rejectWithValue }) => {
    try {
      // Extract files and document types from documents
      const files: File[] = []
      const documentTypes: string[] = []

      formData.documents.forEach((doc) => {
        if (doc.file) {
          files.push(doc.file)
          documentTypes.push(doc.documentType)
        }
      })

      if (files.length === 0) {
        return rejectWithValue('Please upload at least one document')
      }

      const payload: ApplicationCreateRequest = {
        applicantName: `${formData.firstName} ${formData.lastName}`.trim(),
        applicantEmail: formData.applicantEmail,
        applicantPhone: `${formData.phoneCountryCode}${formData.applicantPhone}`,
        applicantAddress: formData.applicantAddress,
        businessName: formData.businessName,
        businessDescription: formData.businessDescription,
        industry: formData.industry,
        businessStage: formData.businessStage,
        foundingDate: formData.foundingDate,
        requestedAmount: formData.requestedAmount,
        files: files,
        documentTypes: documentTypes,
      }

      const response = await applicationsApi.create(payload)
      return response
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit application'
      return rejectWithValue(errorMessage)
    }
  }
)

// Async thunk for fetching applications
export const fetchApplications = createAsyncThunk(
  'application/fetchApplications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getAll()
      return response.data.applications
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch applications')
    }
  }
)

// Async thunk for fetching investment users
export const fetchInvestmentUsers = createAsyncThunk(
  'application/fetchInvestmentUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getInvestmentUsers()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch investment users')
    }
  }
)

// Async thunk for fetching due diligence by application id
export const fetchDueDiligenceByApplication = createAsyncThunk(
  'application/fetchDueDiligenceByApplication',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/due-diligence-api')
      const response = await module.dueDiligenceApi.getByApplicationId(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch due diligence' })
    }
  }
)

// Async thunk for fetching board review by application id
export const fetchBoardReviewByApplication = createAsyncThunk(
  'application/fetchBoardReviewByApplication',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/board-review-api')
      const response = await module.boardReviewApi.getByApplicationId(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch board review' })
    }
  }
)

// Async thunk for fetching term sheet by application id
export const fetchTermSheetByApplication = createAsyncThunk(
  'application/fetchTermSheetByApplication',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/term-sheet-api')
      const response = await module.termSheetApi.getByApplicationId(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch term sheet' })
    }
  }
)

// Async thunk for investor signing term sheet
export const investorSignTermSheet = createAsyncThunk(
  'application/investorSignTermSheet',
  async ({ applicationId, signature }: { applicationId: string; signature: Blob | File }, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/term-sheet-api')
      const response = await module.termSheetApi.investorSign(applicationId, signature)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to sign term sheet' })
    }
  }
)

// Async thunk for fetching fund disbursement by application id
export const fetchFundDisbursementByApplication = createAsyncThunk(
  'application/fetchFundDisbursementByApplication',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/fund-disbursement-api')
      const response = await module.fundDisbursementApi.getByApplicationId(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch fund disbursement' })
    }
  }
)

export const fetchVoteSummaryByApplication = createAsyncThunk(
  'application/fetchVoteSummaryByApplication',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/board-review-api')
      const response = await module.boardReviewApi.getVoteSummary(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch vote summary' })
    }
  }
)

// Async thunk for fetching investment implementation by portfolio company id
export const fetchInvestmentImplementationByApp = createAsyncThunk(
  'application/fetchInvestmentImplementationByApp',
  async ({ applicationId, portfolioCompanyId }: { applicationId: string; portfolioCompanyId: string }, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/investment-implementation-api')
      const response = await module.investmentImplementationApi.getById(portfolioCompanyId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch investment implementation' })
    }
  }
)

// Async thunk for fetching disbursement summary by implementation id
export const fetchDisbursementSummaryByApp = createAsyncThunk(
  'application/fetchDisbursementSummaryByApp',
  async ({ applicationId, implementationId }: { applicationId: string; implementationId: string }, { rejectWithValue }) => {
    try {
      const module = await import('@/lib/api/investment-implementation-api')
      const response = await module.investmentImplementationApi.getDisbursementSummary(implementationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch disbursement summary' })
    }
  }
)

// Async thunk for fetching below-threshold applications
export const fetchBelowThresholdApplications = createAsyncThunk(
  'application/fetchBelowThresholdApplications',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getBelowThresholdApplications(page, limit)
      return response.data.applications
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch below threshold applications')
    }
  }
)

// Async thunk for assigning due diligence task
export const assignDueDiligenceTask = createAsyncThunk(
  'application/assignDueDiligenceTask',
  async ({ applicationId, taskData }: { applicationId: string, taskData: any }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.assignDueDiligenceTask(applicationId, taskData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign task')
    }
  }
)

// Async thunk for creating task activity
export const createTaskActivity = createAsyncThunk(
  'application/createTaskActivity',
  async ({ taskId, activityData }: { taskId: string, activityData: any }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.createTaskActivity(taskId, activityData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create activity')
    }
  }
)

// Async thunk for getting activity for approval
export const getActivityForApproval = createAsyncThunk(
  'application/getActivityForApproval',
  async (activityId: string, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.getActivityForApproval(activityId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activity')
    }
  }
)

// Async thunk for approving activity
export const approveActivity = createAsyncThunk(
  'application/approveActivity',
  async ({ activityId, approvalData }: { activityId: string, approvalData: any }, { rejectWithValue }) => {
    try {
      const response = await applicationsApi.approveActivity(activityId, approvalData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve activity')
    }
  }
)

// Async thunk for casting a vote
export const castVote = createAsyncThunk(
  'application/castVote',
  async ({ applicationId, voteData }: { applicationId: string, voteData: { vote: 'APPROVE' | 'REJECT', comment: string } }, { rejectWithValue }) => {
    try {
      const response = await boardReviewApi.castVote(applicationId, voteData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cast vote')
    }
  }
)

// ─── Investment Memo Editing ────────────────────────────────────────────────
export const fetchMemoHeader = createAsyncThunk(
  'application/fetchMemoHeader',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.getHeader(applicationId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch investment memo' })
    }
  }
)

export const fetchMemoVersions = createAsyncThunk(
  'application/fetchMemoVersions',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.getVersions(applicationId)
      return { applicationId, data: response.data ?? [] }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch memo versions' })
    }
  }
)

export const fetchMemoVersionDetail = createAsyncThunk(
  'application/fetchMemoVersionDetail',
  async ({ applicationId, versionId }: { applicationId: string; versionId: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.getVersion(applicationId, versionId)
      return { versionId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ versionId, message: error.message || 'Failed to fetch memo version' })
    }
  }
)

export const createMemoVersion = createAsyncThunk(
  'application/createMemoVersion',
  async ({ applicationId, changeSummary }: { applicationId: string; changeSummary?: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.createVersion(applicationId, changeSummary)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create new memo version')
    }
  }
)

export const saveMemoVersion = createAsyncThunk(
  'application/saveMemoVersion',
  async (
    { applicationId, versionId, data, validate }: { applicationId: string; versionId: string; data: { sections: Partial<MemoSections>; changeSummary?: string }; validate: boolean },
    { rejectWithValue }
  ) => {
    try {
      const response = await investmentMemoApi.saveVersion(applicationId, versionId, data, validate)
      return { versionId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save memo version')
    }
  }
)

export const validateMemoVersion = createAsyncThunk(
  'application/validateMemoVersion',
  async ({ applicationId, versionId }: { applicationId: string; versionId: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.validateVersion(applicationId, versionId)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to validate memo version')
    }
  }
)

export const submitMemoVersion = createAsyncThunk(
  'application/submitMemoVersion',
  async ({ applicationId, versionId }: { applicationId: string; versionId: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.submitVersion(applicationId, versionId)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit memo for approval')
    }
  }
)

export const approveMemoVersion = createAsyncThunk(
  'application/approveMemoVersion',
  async ({ applicationId, versionId, comment }: { applicationId: string; versionId: string; comment: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.approveVersion(applicationId, versionId, comment)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve memo')
    }
  }
)

export const rejectMemoVersion = createAsyncThunk(
  'application/rejectMemoVersion',
  async ({ applicationId, versionId, comment }: { applicationId: string; versionId: string; comment: string }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.rejectVersion(applicationId, versionId, comment)
      return { applicationId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reject memo')
    }
  }
)

export const uploadMemoAttachment = createAsyncThunk(
  'application/uploadMemoAttachment',
  async ({ applicationId, versionId, file }: { applicationId: string; versionId: string; file: File }, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.uploadAttachment(applicationId, versionId, file)
      return { versionId, data: response.data }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload attachment')
    }
  }
)

export const fetchMemoApprovalHistory = createAsyncThunk(
  'application/fetchMemoApprovalHistory',
  async (applicationId: string, { rejectWithValue }) => {
    try {
      const response = await investmentMemoApi.getApprovalHistory(applicationId)
      return { applicationId, data: response.data ?? [] }
    } catch (error: any) {
      return rejectWithValue({ applicationId, message: error.message || 'Failed to fetch approval history' })
    }
  }
)

const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateFormField: (state, action: PayloadAction<{ field: keyof ApplicationFormData; value: any }>) => {
      const field: keyof ApplicationFormData = action.payload.field;
      const value = action.payload.value;
      (state as any)[field] = value;
      // Clear error for this field when updated
      if (state.errors[field as string]) {
        delete state.errors[field as string];
      }
    },

    updateDocument: (state, action: PayloadAction<{ index: number; document: Partial<Document> }>) => {
      const { index, document } = action.payload
      if (state.documents[index]) {
        state.documents[index] = { ...state.documents[index], ...document }
      }
    },

    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.push(action.payload)
    },

    removeDocument: (state, action: PayloadAction<number>) => {
      state.documents.splice(action.payload, 1)
    },

    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },

    nextStep: (state) => {
      if (state.currentStep < 3) {
        state.currentStep += 1
      }
    },

    previousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1
      }
    },

    setErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.errors = action.payload
    },

    clearErrors: (state) => {
      state.errors = {}
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload
    },
    setLastResponse: (state, action: PayloadAction<any>) => {
      state.lastResponse = action.payload
    },

    resetForm: (state) => {
      return { ...initialState }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLatestApplicationById.pending, (state) => {
        state.latestApplicationLoading = true
      })
      .addCase(fetchLatestApplicationById.fulfilled, (state, action) => {
        state.latestApplicationLoading = false
        state.latestApplication = action.payload
      })
      .addCase(fetchLatestApplicationById.rejected, (state) => {
        state.latestApplicationLoading = false
      })
      .addCase(submitApplication.pending, (state) => {
        state.isSubmitting = true
        state.submitError = undefined
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.lastResponse = action.payload
        state.submitError = undefined
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.isSubmitting = false
        state.submitError = action.payload as string
      })
      .addCase(fetchApplications.pending, (state) => {
        state.isLoading = true
        state.fetchError = undefined
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false
        state.applications = action.payload
        state.fetchError = undefined
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false
        state.fetchError = action.payload as string
      })
      .addCase(fetchInvestmentUsers.pending, (state) => {
        state.usersLoading = true
        state.fetchError = undefined
      })
      .addCase(fetchInvestmentUsers.fulfilled, (state, action) => {
        state.usersLoading = false
        state.investmentUsers = action.payload
        state.fetchError = undefined
      })
      .addCase(fetchInvestmentUsers.rejected, (state, action) => {
        state.usersLoading = false
        state.fetchError = action.payload as string
      })
      .addCase(fetchDueDiligenceByApplication.pending, (state, action) => {
        const appId = action.meta.arg
        state.dueDiligenceLoadingByApp[appId] = true
      })
      .addCase(fetchDueDiligenceByApplication.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.dueDiligenceLoadingByApp[applicationId] = false
        state.dueDiligenceByApp[applicationId] = data
      })
      .addCase(fetchDueDiligenceByApplication.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.dueDiligenceLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchBoardReviewByApplication.pending, (state, action) => {
        const appId = action.meta.arg
        state.boardReviewLoadingByApp[appId] = true
      })
      .addCase(fetchBoardReviewByApplication.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.boardReviewLoadingByApp[applicationId] = false
        state.boardReviewByApp[applicationId] = data
      })
      .addCase(fetchBoardReviewByApplication.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.boardReviewLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchTermSheetByApplication.pending, (state, action) => {
        const appId = action.meta.arg
        state.termSheetLoadingByApp[appId] = true
      })
      .addCase(fetchTermSheetByApplication.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.termSheetLoadingByApp[applicationId] = false
        state.termSheetByApp[applicationId] = data
      })
      .addCase(fetchTermSheetByApplication.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.termSheetLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(investorSignTermSheet.pending, (state, action) => {
        const appId = action.meta.arg.applicationId
        state.termSheetLoadingByApp[appId] = true
      })
      .addCase(investorSignTermSheet.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.termSheetLoadingByApp[applicationId] = false
        state.termSheetByApp[applicationId] = data
      })
      .addCase(investorSignTermSheet.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.termSheetLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchFundDisbursementByApplication.pending, (state, action) => {
        const appId = action.meta.arg
        state.fundDisbursementLoadingByApp[appId] = true
      })
      .addCase(fetchFundDisbursementByApplication.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.fundDisbursementLoadingByApp[applicationId] = false
        state.fundDisbursementByApp[applicationId] = data
      })
      .addCase(fetchFundDisbursementByApplication.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.fundDisbursementLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchVoteSummaryByApplication.pending, (state, action) => {
        const appId = action.meta.arg
        state.voteSummaryLoadingByApp[appId] = true
      })
      .addCase(fetchVoteSummaryByApplication.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.voteSummaryLoadingByApp[applicationId] = false
        state.voteSummaryByApp[applicationId] = data
      })
      .addCase(fetchVoteSummaryByApplication.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.voteSummaryLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchInvestmentImplementationByApp.pending, (state, action) => {
        const appId = action.meta.arg.applicationId
        state.investmentImplementationLoadingByApp[appId] = true
      })
      .addCase(fetchInvestmentImplementationByApp.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.investmentImplementationLoadingByApp[applicationId] = false
        state.investmentImplementationByApp[applicationId] = data
      })
      .addCase(fetchInvestmentImplementationByApp.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.investmentImplementationLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchDisbursementSummaryByApp.pending, (state, action) => {
        const appId = action.meta.arg.applicationId
        state.disbursementSummaryLoadingByApp[appId] = true
      })
      .addCase(fetchDisbursementSummaryByApp.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.disbursementSummaryLoadingByApp[applicationId] = false
        state.disbursementSummaryByApp[applicationId] = data
      })
      .addCase(fetchDisbursementSummaryByApp.rejected, (state, action) => {
        const maybe = action.payload as any
        if (maybe && maybe.applicationId) {
          state.disbursementSummaryLoadingByApp[maybe.applicationId] = false
        }
      })

      .addCase(fetchBelowThresholdApplications.pending, (state) => {
        state.belowThresholdLoading = true
      })
      .addCase(fetchBelowThresholdApplications.fulfilled, (state, action) => {
        state.belowThresholdLoading = false
        state.belowThresholdApplications = action.payload
      })
      .addCase(fetchBelowThresholdApplications.rejected, (state) => {
        state.belowThresholdLoading = false
      })
      .addCase(assignDueDiligenceTask.pending, (state) => {
        state.isSubmitting = true
        state.submitError = undefined
      })
      .addCase(assignDueDiligenceTask.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.lastResponse = action.payload
        state.submitError = undefined
      })
      .addCase(assignDueDiligenceTask.rejected, (state, action) => {
        state.isSubmitting = false
        state.submitError = action.payload as string
      })
      .addCase(createTaskActivity.pending, (state) => {
        state
      })
      .addCase(getActivityForApproval.fulfilled, (state, action) => {
        state.isLoading = false
        state.lastResponse = action.payload
        state.fetchError = undefined
      })
      .addCase(getActivityForApproval.rejected, (state, action) => {
        state.isLoading = false
        state.fetchError = action.payload as string
      })
      .addCase(approveActivity.pending, (state) => {
        state.isSubmitting = true
        state.submitError = undefined
      })
      .addCase(approveActivity.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.lastResponse = action.payload
        state.submitError = undefined
      })
      .addCase(approveActivity.rejected, (state, action) => {
        state.isSubmitting = false
        state.submitError = action.payload as string
      })
      .addCase(castVote.pending, (state) => {
        state.isSubmitting = true
        state.submitError = undefined
      })
      .addCase(castVote.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.lastResponse = action.payload
      })
      .addCase(castVote.rejected, (state, action) => {
        state.isSubmitting = false
        state.submitError = action.payload as string
      })

      // Investment Memo Editing
      .addCase(fetchMemoHeader.pending, (state, action) => {
        state.investmentMemoLoadingByApp[action.meta.arg] = true
      })
      .addCase(fetchMemoHeader.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.investmentMemoLoadingByApp[applicationId] = false
        state.investmentMemoByApp[applicationId] = data
      })
      .addCase(fetchMemoHeader.rejected, (state, action) => {
        const { applicationId, message } = (action.payload as any) || {}
        if (applicationId) state.investmentMemoLoadingByApp[applicationId] = false
        state.memoError = message
      })

      .addCase(fetchMemoVersions.pending, (state, action) => {
        state.memoVersionsLoadingByApp[action.meta.arg] = true
      })
      .addCase(fetchMemoVersions.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.memoVersionsLoadingByApp[applicationId] = false
        state.memoVersionsByApp[applicationId] = data
      })
      .addCase(fetchMemoVersions.rejected, (state, action) => {
        const { applicationId, message } = (action.payload as any) || {}
        if (applicationId) state.memoVersionsLoadingByApp[applicationId] = false
        state.memoError = message
      })

      .addCase(fetchMemoVersionDetail.pending, (state, action) => {
        state.memoVersionDetailLoadingById[action.meta.arg.versionId] = true
      })
      .addCase(fetchMemoVersionDetail.fulfilled, (state, action) => {
        const { versionId, data } = action.payload as any
        state.memoVersionDetailLoadingById[versionId] = false
        state.memoVersionDetailById[versionId] = data
      })
      .addCase(fetchMemoVersionDetail.rejected, (state, action) => {
        const { versionId, message } = (action.payload as any) || {}
        if (versionId) state.memoVersionDetailLoadingById[versionId] = false
        state.memoError = message
      })

      .addCase(createMemoVersion.pending, (state) => { state.memoSaving = true })
      .addCase(createMemoVersion.fulfilled, (state, action) => {
        state.memoSaving = false
        const { data } = action.payload as any
        if (data?.id) state.memoVersionDetailById[data.id] = data
      })
      .addCase(createMemoVersion.rejected, (state, action) => {
        state.memoSaving = false
        state.memoError = action.payload as string
      })

      .addCase(saveMemoVersion.pending, (state) => { state.memoSaving = true })
      .addCase(saveMemoVersion.fulfilled, (state, action) => {
        state.memoSaving = false
        const { versionId, data } = action.payload as any
        state.memoVersionDetailById[versionId] = data
      })
      .addCase(saveMemoVersion.rejected, (state, action) => {
        state.memoSaving = false
        state.memoError = action.payload as string
      })

      .addCase(validateMemoVersion.pending, (state) => { state.memoValidating = true })
      .addCase(validateMemoVersion.fulfilled, (state) => { state.memoValidating = false })
      .addCase(validateMemoVersion.rejected, (state, action) => {
        state.memoValidating = false
        state.memoError = action.payload as string
      })

      .addCase(submitMemoVersion.pending, (state) => { state.memoSubmitting = true })
      .addCase(submitMemoVersion.fulfilled, (state, action) => {
        state.memoSubmitting = false
        const { applicationId, data } = action.payload as any
        state.investmentMemoByApp[applicationId] = data
      })
      .addCase(submitMemoVersion.rejected, (state, action) => {
        state.memoSubmitting = false
        state.memoError = action.payload as string
      })

      .addCase(approveMemoVersion.pending, (state) => { state.memoApproving = true })
      .addCase(approveMemoVersion.fulfilled, (state, action) => {
        state.memoApproving = false
        const { applicationId, data } = action.payload as any
        state.investmentMemoByApp[applicationId] = data
      })
      .addCase(approveMemoVersion.rejected, (state, action) => {
        state.memoApproving = false
        state.memoError = action.payload as string
      })

      .addCase(rejectMemoVersion.pending, (state) => { state.memoRejecting = true })
      .addCase(rejectMemoVersion.fulfilled, (state, action) => {
        state.memoRejecting = false
        const { applicationId, data } = action.payload as any
        state.investmentMemoByApp[applicationId] = data
      })
      .addCase(rejectMemoVersion.rejected, (state, action) => {
        state.memoRejecting = false
        state.memoError = action.payload as string
      })

      .addCase(uploadMemoAttachment.fulfilled, (state, action) => {
        const { versionId, data } = action.payload as any
        state.memoVersionDetailById[versionId] = data
      })

      .addCase(fetchMemoApprovalHistory.pending, (state, action) => {
        state.memoApprovalHistoryLoadingByApp[action.meta.arg] = true
      })
      .addCase(fetchMemoApprovalHistory.fulfilled, (state, action) => {
        const { applicationId, data } = action.payload as any
        state.memoApprovalHistoryLoadingByApp[applicationId] = false
        state.memoApprovalHistoryByApp[applicationId] = data
      })
      .addCase(fetchMemoApprovalHistory.rejected, (state, action) => {
        const { applicationId, message } = (action.payload as any) || {}
        if (applicationId) state.memoApprovalHistoryLoadingByApp[applicationId] = false
        state.memoError = message
      })
  }
})

export const {
  updateFormField,
  updateDocument,
  addDocument,
  removeDocument,
  setCurrentStep,
  nextStep,
  previousStep,
  setErrors,
  clearErrors,
  setSubmitting,
  setLastResponse,
  resetForm
} = applicationSlice.actions

export default applicationSlice.reducer
