import { configureStore } from '@reduxjs/toolkit'
import accountingReducer from './slices/accountingSlice'
import cashbookReducer from './slices/cashbookSlice'
import portfolioDashboardReducer from './slices/portfolioDashboardSlice'
import procurementV2Reducer from './slices/procurementV2Slice'
import invoicesReducer from './slices/invoices-slice'
import purchaseInvoicesReducer from './slices/purchase-invoices-slice'

export const store = configureStore({
  reducer: {
    accounting: accountingReducer,
    cashbook: cashbookReducer,
    portfolioDashboard: portfolioDashboardReducer,
    procurementV2: procurementV2Reducer,
    invoices: invoicesReducer,
    purchaseInvoices: purchaseInvoicesReducer,
  },
  // ...existing middleware...
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch