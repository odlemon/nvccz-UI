import { configureStore } from "@reduxjs/toolkit"
import { type TypedUseSelectorHook, useDispatch, useSelector } from "react-redux"
import portfolioSlice from "./slices/portfolioSlice"
import zseStocksReducer from "./zse-stocks-slice"
import marketOverviewReducer from "./market-overview-slice"
import applicationsSlice from "./slices/applicationsSlice"
import applicationSlice from "./slices/applicationSlice"
import companiesSlice from "./slices/companiesSlice"
import fundsSlice from "./slices/fundsSlice"
import accountSlice from "./slices/accountSlice"
import uiSlice from "./slices/uiSlice"
import authSlice from "./slices/authSlice"
import financialDataSlice from "./slices/financialDataSlice"
import performanceSlice from "./slices/performanceSlice"
import payrollSlice from "./slices/payrollSlice"
import procurementSlice from "./slices/procurementSlice"
import procurementV2Slice from "./slices/procurementV2Slice"
import currenciesSlice from "./slices/currenciesSlice"
import usersSlice from "./slices/usersSlice"
import taskSlice from "./slices/taskSlice"
import accountingReducer from "./slices/accountingSlice"
import invoicesReducer from "./slices/invoices-slice"
import purchaseInvoicesReducer from "./slices/purchase-invoices-slice"
import accountingReducer2 from "./slices/accountingSlice"
import eventsReducer from './slices/eventsSlice';
import analyticsReducer from './slices/analyticsSlice'
import testPerfomanceReducer from './slices/testPerfomanceSlice'
import cashbookReducer from './slices/cashbookSlice'
import scorecardReducer from "./slices/scorecardSlice"
import adminReducer from './slices/adminSlice'
import applicationPortalReducer from './slices/applicationPortalSlice'
import portfolioCompaniesReducer from './slices/portfolioCompaniesSlice'
import portfolioDashboardReducer from './slices/portfolioDashboardSlice'
import reconciliationReducer from './slices/reconciliationSlice'
import shortTermInvestmentsReducer from './slices/shortTermInvestmentsSlice'
import performanceConfigReducer from './slices/performanceConfigSlice'
import performanceTasksReducer from './slices/performanceTasksSlice'
import performanceReviewsReducer from './slices/performanceReviewsSlice'
import notificationsReducer from './slices/notificationsSlice'
import portfolioReportingReducer from './slices/portfolioReportingSlice'

export const store = configureStore({
  reducer: {
    portfolio: portfolioSlice,
    applications: applicationsSlice,
    application: applicationSlice,
    companies: companiesSlice,
    funds: fundsSlice,
    account: accountSlice,
    ui: uiSlice,
    auth: authSlice,
    financialData: financialDataSlice,
    performance: performanceSlice,
    payroll: payrollSlice,
    procurement: procurementSlice,
    procurementV2: procurementV2Slice,
    currencies: currenciesSlice,
    users: usersSlice,
    tasks: taskSlice,
    accounting: accountingReducer,
    invoices: invoicesReducer,
    purchaseInvoices: purchaseInvoicesReducer,
    events: eventsReducer,
    analytics: analyticsReducer,
    testPerfomance:testPerfomanceReducer,
    cashbook: cashbookReducer,
    scorecard: scorecardReducer,
    admin: adminReducer,
    applicationPortal: applicationPortalReducer,
    portfolioCompanies: portfolioCompaniesReducer,
    portfolioDashboard: portfolioDashboardReducer,
    reconciliation: reconciliationReducer,
    zseStocks: zseStocksReducer,
    marketOverview: marketOverviewReducer,
    shortTermInvestments: shortTermInvestmentsReducer,
    performanceConfig: performanceConfigReducer,
    performanceTasks: performanceTasksReducer,
    performanceReviews: performanceReviewsReducer,
    notifications: notificationsReducer,
    portfolioReporting: portfolioReportingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
