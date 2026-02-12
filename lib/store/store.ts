import { configureStore } from '@reduxjs/toolkit'
import accountingReducer from './slices/accountingSlice'
import cashbookReducer from './slices/cashbookSlice'
import portfolioDashboardReducer from './slices/portfolioDashboardSlice'
import procurementV2Reducer from './slices/procurementV2Slice'
import invoicesReducer from './slices/invoices-slice'
import purchaseInvoicesReducer from './slices/purchase-invoices-slice'
import payrollReducer from './slices/payrollSlice'
import performanceReducer from './slices/performanceSlice'
import applicationReducer from './slices/applicationSlice'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import fundsReducer from './slices/fundsSlice'

export const store = configureStore({
  reducer: {
    accounting: accountingReducer,
    cashbook: cashbookReducer,
    portfolioDashboard: portfolioDashboardReducer,
    procurementV2: procurementV2Reducer,
    invoices: invoicesReducer,
    purchaseInvoices: purchaseInvoicesReducer,
    payroll: payrollReducer,
    performance: performanceReducer,
    application: applicationReducer,
    auth: authReducer,
    ui: uiReducer,
    funds: fundsReducer,
  },
  // ...existing middleware...
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch