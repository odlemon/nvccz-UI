import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import {
  lpPortalAdminApi,
  LpPortalMembership,
  CreateLpMembershipRequest,
  PublishDocumentRequest,
  MfaPolicy,
} from "@/lib/api/lp-portal-admin-api"
import { clientsApi } from "@/lib/api/capital-calls-api"

interface LpPortalAdminState {
  memberships: LpPortalMembership[]
  membershipsLoading: boolean
  membershipsError: string | null
  inviteLoading: boolean
  inviteError: string | null
  revokeLoadingById: Record<string, boolean>

  publishDocumentLoading: boolean
  publishDocumentError: string | null

  mfaPolicy: MfaPolicy | null
  mfaPolicyLoading: boolean
  mfaPolicyError: string | null
  mfaPolicySaving: boolean

  linkUserLoadingByClientId: Record<string, boolean>
  linkUserErrorByClientId: Record<string, string>
}

const initialState: LpPortalAdminState = {
  memberships: [],
  membershipsLoading: false,
  membershipsError: null,
  inviteLoading: false,
  inviteError: null,
  revokeLoadingById: {},

  publishDocumentLoading: false,
  publishDocumentError: null,

  mfaPolicy: null,
  mfaPolicyLoading: false,
  mfaPolicyError: null,
  mfaPolicySaving: false,

  linkUserLoadingByClientId: {},
  linkUserErrorByClientId: {},
}

export const fetchMemberships = createAsyncThunk(
  'lpPortalAdmin/fetchMemberships',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.getMemberships()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch LP memberships')
    }
  }
)

export const inviteMembership = createAsyncThunk(
  'lpPortalAdmin/inviteMembership',
  async (data: CreateLpMembershipRequest, { dispatch, rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.inviteMembership(data)
      dispatch(fetchMemberships())
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to invite LP membership')
    }
  }
)

export const revokeMembership = createAsyncThunk(
  'lpPortalAdmin/revokeMembership',
  async (membershipId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.revokeMembership(membershipId)
      dispatch(fetchMemberships())
      return response.data
    } catch (error: any) {
      return rejectWithValue({ membershipId, message: error.message || 'Failed to revoke LP membership' })
    }
  }
)

export const publishLpDocument = createAsyncThunk(
  'lpPortalAdmin/publishLpDocument',
  async (data: PublishDocumentRequest, { rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.publishDocument(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to publish document')
    }
  }
)

export const fetchMfaPolicy = createAsyncThunk(
  'lpPortalAdmin/fetchMfaPolicy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.getMfaPolicy()
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch MFA policy')
    }
  }
)

export const updateMfaPolicy = createAsyncThunk(
  'lpPortalAdmin/updateMfaPolicy',
  async (data: { requireMfaForLp: boolean; issuerName: string }, { rejectWithValue }) => {
    try {
      const response = await lpPortalAdminApi.updateMfaPolicy(data)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update MFA policy')
    }
  }
)

export const linkClientToUser = createAsyncThunk(
  'lpPortalAdmin/linkClientToUser',
  async ({ clientId, userId }: { clientId: string; userId: string }, { rejectWithValue }) => {
    try {
      const response = await clientsApi.linkUser(clientId, userId)
      return { clientId, data: response.data }
    } catch (error: any) {
      return rejectWithValue({ clientId, message: error.message || 'Failed to link client to user' })
    }
  }
)

const lpPortalAdminSlice = createSlice({
  name: 'lpPortalAdmin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemberships.pending, (state) => { state.membershipsLoading = true; state.membershipsError = null })
      .addCase(fetchMemberships.fulfilled, (state, action) => { state.membershipsLoading = false; state.memberships = action.payload })
      .addCase(fetchMemberships.rejected, (state, action) => { state.membershipsLoading = false; state.membershipsError = action.payload as string })

      .addCase(inviteMembership.pending, (state) => { state.inviteLoading = true; state.inviteError = null })
      .addCase(inviteMembership.fulfilled, (state) => { state.inviteLoading = false })
      .addCase(inviteMembership.rejected, (state, action) => { state.inviteLoading = false; state.inviteError = action.payload as string })

      .addCase(revokeMembership.pending, (state, action) => { state.revokeLoadingById[action.meta.arg] = true })
      .addCase(revokeMembership.fulfilled, (state, action) => { state.revokeLoadingById[action.meta.arg] = false })
      .addCase(revokeMembership.rejected, (state, action) => {
        const payload = action.payload as { membershipId: string; message: string }
        state.revokeLoadingById[payload.membershipId] = false
      })

      .addCase(publishLpDocument.pending, (state) => { state.publishDocumentLoading = true; state.publishDocumentError = null })
      .addCase(publishLpDocument.fulfilled, (state) => { state.publishDocumentLoading = false })
      .addCase(publishLpDocument.rejected, (state, action) => { state.publishDocumentLoading = false; state.publishDocumentError = action.payload as string })

      .addCase(fetchMfaPolicy.pending, (state) => { state.mfaPolicyLoading = true; state.mfaPolicyError = null })
      .addCase(fetchMfaPolicy.fulfilled, (state, action) => { state.mfaPolicyLoading = false; state.mfaPolicy = action.payload })
      .addCase(fetchMfaPolicy.rejected, (state, action) => { state.mfaPolicyLoading = false; state.mfaPolicyError = action.payload as string })

      .addCase(updateMfaPolicy.pending, (state) => { state.mfaPolicySaving = true })
      .addCase(updateMfaPolicy.fulfilled, (state, action) => { state.mfaPolicySaving = false; state.mfaPolicy = action.payload })
      .addCase(updateMfaPolicy.rejected, (state, action) => { state.mfaPolicySaving = false; state.mfaPolicyError = action.payload as string })

      .addCase(linkClientToUser.pending, (state, action) => {
        state.linkUserLoadingByClientId[action.meta.arg.clientId] = true
        delete state.linkUserErrorByClientId[action.meta.arg.clientId]
      })
      .addCase(linkClientToUser.fulfilled, (state, action) => { state.linkUserLoadingByClientId[action.payload.clientId] = false })
      .addCase(linkClientToUser.rejected, (state, action) => {
        const payload = action.payload as { clientId: string; message: string }
        state.linkUserLoadingByClientId[payload.clientId] = false
        state.linkUserErrorByClientId[payload.clientId] = payload.message
      })
  },
})

export default lpPortalAdminSlice.reducer
