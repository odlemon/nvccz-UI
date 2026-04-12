import { createSlice, createAsyncThunk, createSelector, PayloadAction } from '@reduxjs/toolkit'
import { reconciliationApi, ReconciliationEntry, ReconciliationSession, CreateSessionRequest, UpdateSessionRequest } from '@/lib/api/reconciliation-api'
import { ImportedBankStatement } from '@/lib/utils/bank-statement-import'
import { RootState } from '../store'

interface ReconciliationState {
    // Candidate entries
    entries: ReconciliationEntry[]
    entriesLoading: boolean
    entriesError: string | null

    // Session list
    sessions: ReconciliationSession[]
    sessionsLoading: boolean
    sessionsError: string | null

    // Active session (being worked on)
    activeSession: ReconciliationSession | null
    activeSessionLoading: boolean
    activeSessionError: string | null

    // Local selection state (before save)
    selectedEntryIds: string[]

    // Form fields
    statementDate: string
    statementEndBalance: number | null
    reference: string
    openingBalance: number | null

    // Imported statement context
    importedStatement: ImportedBankStatement | null
    importedStatementFileName: string | null
    autoMatchedEntryIds: string[]

    // Action loading states
    savingDraft: boolean
    finishing: boolean
    discarding: boolean
}

const initialState: ReconciliationState = {
    entries: [],
    entriesLoading: false,
    entriesError: null,

    sessions: [],
    sessionsLoading: false,
    sessionsError: null,

    activeSession: null,
    activeSessionLoading: false,
    activeSessionError: null,

    selectedEntryIds: [],

    statementDate: '',
    statementEndBalance: null,
    reference: '',
    openingBalance: null,

    importedStatement: null,
    importedStatementFileName: null,
    autoMatchedEntryIds: [],

    savingDraft: false,
    finishing: false,
    discarding: false,
}

// --- ASYNC THUNKS ---

export const fetchReconciliationEntries = createAsyncThunk(
    'reconciliation/fetchEntries',
    async ({ bankId, asOf, includeReconciled }: { bankId: string; asOf: string; includeReconciled?: boolean }) => {
        const response = await reconciliationApi.getReconciliationEntries(bankId, asOf, includeReconciled)
        return response.data
    }
)

export const fetchReconciliationSessions = createAsyncThunk(
    'reconciliation/fetchSessions',
    async (bankId: string) => {
        const response = await reconciliationApi.listSessions(bankId)
        return response.data
    }
)

export const createReconciliationDraft = createAsyncThunk(
    'reconciliation/createDraft',
    async ({ bankId, data }: { bankId: string; data: CreateSessionRequest }) => {
        const response = await reconciliationApi.createDraftSession(bankId, data)
        return response.data
    }
)

export const fetchReconciliationSession = createAsyncThunk(
    'reconciliation/fetchSession',
    async (sessionId: string) => {
        const response = await reconciliationApi.getSession(sessionId)
        return response.data
    }
)

export const updateReconciliationDraft = createAsyncThunk(
    'reconciliation/updateDraft',
    async ({ sessionId, data }: { sessionId: string; data: UpdateSessionRequest }) => {
        const response = await reconciliationApi.updateDraftSession(sessionId, data)
        return response.data
    }
)

export const finishReconciliationSession = createAsyncThunk(
    'reconciliation/finish',
    async (sessionId: string) => {
        const response = await reconciliationApi.finishSession(sessionId)
        return response.data
    }
)

export const discardReconciliationSession = createAsyncThunk(
    'reconciliation/discard',
    async (sessionId: string) => {
        const response = await reconciliationApi.discardSession(sessionId)
        return response.data
    }
)

// --- SLICE ---

const reconciliationSlice = createSlice({
    name: 'reconciliation',
    initialState,
    reducers: {
        toggleEntrySelection(state, action: PayloadAction<string>) {
            const id = action.payload
            const idx = state.selectedEntryIds.indexOf(id)
            if (idx >= 0) {
                state.selectedEntryIds.splice(idx, 1)
            } else {
                state.selectedEntryIds.push(id)
            }
        },
        selectAllEntries(state) {
            state.selectedEntryIds = state.entries
                .filter(e => !e.isReconciled)
                .map(e => e.id)
        },
        unselectAllEntries(state) {
            state.selectedEntryIds = []
        },
        setStatementDate(state, action: PayloadAction<string>) {
            state.statementDate = action.payload
        },
        setStatementEndBalance(state, action: PayloadAction<number | null>) {
            state.statementEndBalance = action.payload
        },
        setReference(state, action: PayloadAction<string>) {
            state.reference = action.payload
        },
        setOpeningBalance(state, action: PayloadAction<number | null>) {
            state.openingBalance = action.payload
        },
        setImportedStatement(
            state,
            action: PayloadAction<{ statement: ImportedBankStatement; fileName: string } | null>
        ) {
            if (!action.payload) {
                state.importedStatement = null
                state.importedStatementFileName = null
                state.autoMatchedEntryIds = []
                return
            }

            const { statement, fileName } = action.payload
            state.importedStatement = statement
            state.importedStatementFileName = fileName

            if (statement.statementDate) {
                state.statementDate = statement.statementDate
            }
            if (typeof statement.openingBalance === 'number') {
                state.openingBalance = statement.openingBalance
            }
            if (typeof statement.closingBalance === 'number') {
                state.statementEndBalance = statement.closingBalance
            }
        },
        setAutoMatchedEntryIds(state, action: PayloadAction<string[]>) {
            state.autoMatchedEntryIds = action.payload
            state.selectedEntryIds = action.payload
        },
        clearActiveSession(state) {
            state.activeSession = null
            state.activeSessionError = null
            state.selectedEntryIds = []
            state.entries = []
            state.entriesError = null
            state.statementDate = ''
            state.statementEndBalance = null
            state.reference = ''
            state.openingBalance = null
            state.importedStatement = null
            state.importedStatementFileName = null
            state.autoMatchedEntryIds = []
        },
        setSelectedEntryIds(state, action: PayloadAction<string[]>) {
            state.selectedEntryIds = action.payload
        },
    },
    extraReducers: (builder) => {
        // Fetch entries
        builder.addCase(fetchReconciliationEntries.pending, (state) => {
            state.entriesLoading = true
            state.entriesError = null
        })
        builder.addCase(fetchReconciliationEntries.fulfilled, (state, action) => {
            state.entriesLoading = false
            state.entries = action.payload || []
        })
        builder.addCase(fetchReconciliationEntries.rejected, (state, action) => {
            state.entriesLoading = false
            state.entriesError = action.error.message || 'Failed to load entries'
        })

        // Fetch sessions
        builder.addCase(fetchReconciliationSessions.pending, (state) => {
            state.sessionsLoading = true
            state.sessionsError = null
        })
        builder.addCase(fetchReconciliationSessions.fulfilled, (state, action) => {
            state.sessionsLoading = false
            state.sessions = action.payload || []
        })
        builder.addCase(fetchReconciliationSessions.rejected, (state, action) => {
            state.sessionsLoading = false
            state.sessionsError = action.error.message || 'Failed to load sessions'
        })

        // Create draft
        builder.addCase(createReconciliationDraft.pending, (state) => {
            state.savingDraft = true
        })
        builder.addCase(createReconciliationDraft.fulfilled, (state, action) => {
            state.savingDraft = false
            state.activeSession = action.payload || null
        })
        builder.addCase(createReconciliationDraft.rejected, (state) => {
            state.savingDraft = false
        })

        // Fetch session
        builder.addCase(fetchReconciliationSession.pending, (state) => {
            state.activeSessionLoading = true
            state.activeSessionError = null
        })
        builder.addCase(fetchReconciliationSession.fulfilled, (state, action) => {
            state.activeSessionLoading = false
            const session = action.payload
            state.activeSession = session || null
            state.importedStatement = null
            state.importedStatementFileName = null
            state.autoMatchedEntryIds = []
            if (session) {
                state.statementDate = session.statementDate
                state.statementEndBalance = session.statementEndBalance
                state.reference = session.reference || ''
                state.openingBalance = session.openingBalance
                // Restore selection state from session lines
                state.selectedEntryIds = (session.lines || [])
                    .filter(l => l.selected)
                    .map(l => l.cashbookEntryId)
                // Populate entries from session lines
                state.entries = (session.lines || []).map(l => l.entry)
            }
        })
        builder.addCase(fetchReconciliationSession.rejected, (state, action) => {
            state.activeSessionLoading = false
            state.activeSessionError = action.error.message || 'Failed to load session'
        })

        // Update draft
        builder.addCase(updateReconciliationDraft.pending, (state) => {
            state.savingDraft = true
        })
        builder.addCase(updateReconciliationDraft.fulfilled, (state, action) => {
            state.savingDraft = false
            state.activeSession = action.payload || null
        })
        builder.addCase(updateReconciliationDraft.rejected, (state) => {
            state.savingDraft = false
        })

        // Finish
        builder.addCase(finishReconciliationSession.pending, (state) => {
            state.finishing = true
        })
        builder.addCase(finishReconciliationSession.fulfilled, (state, action) => {
            state.finishing = false
            state.activeSession = action.payload || null
        })
        builder.addCase(finishReconciliationSession.rejected, (state) => {
            state.finishing = false
        })

        // Discard
        builder.addCase(discardReconciliationSession.pending, (state) => {
            state.discarding = true
        })
        builder.addCase(discardReconciliationSession.fulfilled, (state) => {
            state.discarding = false
            state.activeSession = null
            state.selectedEntryIds = []
        })
        builder.addCase(discardReconciliationSession.rejected, (state) => {
            state.discarding = false
        })
    },
})

export const {
    toggleEntrySelection,
    selectAllEntries,
    unselectAllEntries,
    setStatementDate,
    setStatementEndBalance,
    setReference,
    setOpeningBalance,
    setImportedStatement,
    setAutoMatchedEntryIds,
    clearActiveSession,
    setSelectedEntryIds,
} = reconciliationSlice.actions

// --- SELECTORS ---

const selectReconciliationState = (state: RootState) => state.reconciliation

export const selectSelectedEntryIdsSet = createSelector(
    selectReconciliationState,
    (state) => new Set(state.selectedEntryIds)
)

export const selectReconciliationTotals = createSelector(
    selectReconciliationState,
    (state) => {
        const selectedSet = new Set(state.selectedEntryIds)
        let totalReceived = 0
        let totalPaid = 0

        for (const entry of state.entries) {
            if (selectedSet.has(entry.id)) {
                totalReceived += entry.received || 0
                totalPaid += entry.paid || 0
            }
        }

        const opening = state.openingBalance || 0
        const reconciledBalance = opening + totalReceived - totalPaid
        const target = state.statementEndBalance || 0
        const difference = target - reconciledBalance

        return {
            openingBalance: opening,
            totalReceived,
            totalPaid,
            reconciledBalance,
            statementEndBalance: target,
            difference,
        }
    }
)

export const selectIsBalanced = createSelector(
    selectReconciliationTotals,
    (totals) => Math.abs(totals.difference) < 0.01
)

export default reconciliationSlice.reducer
