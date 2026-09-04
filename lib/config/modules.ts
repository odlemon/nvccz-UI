import {
  CiHome,
  CiShop,
  CiViewTimeline,
  CiFileOn,
  CiWallet,
  CiUser,
  CiSettings,
  CiDollar,
  CiCalendar,
  CiGrid41,
  CiViewBoard,
  CiViewTable,
  CiViewColumn,
  CiViewList,
  CiCircleCheck,
  CiMoneyCheck1,
  CiCirclePlus,
  CiGift,
  CiMapPin,
  CiBoxes,
  CiReceipt,
  CiBarcode,
  CiCoins1,
  CiMedal,
  CiText,
  CiTrophy,
  CiLock,
  CiBellOn
} from "react-icons/ci"
import {
  ShoppingCart,
  Package,
  Truck,
  Receipt,
  Calculator,
  Building2,
  Users,
  Landmark,
  BarChart3,
  Settings,
  TrendingUp,
  DollarSign,
  FileText,
  CandlestickChart,
  Monitor,
  ArrowLeftRight,
  Handshake,
  Kanban,
  FolderLock,
  Mail,
  CalendarDays,
  FileSignature,
  CircleDollarSign,
  UserCheck,
  Briefcase,
  LineChart,
  ClipboardCheck,
  ScrollText,
  Contact,
  ClipboardList,
  Scale,
  LayoutDashboard,
  HeartHandshake,
  Sparkles,
  Target,
} from "lucide-react"
import { IconType } from "react-icons"
import { IoPeopleOutline, IoReceiptOutline, IoStatsChartOutline } from "react-icons/io5"
import { INVESTEE_PORTAL_EXTERNAL_URL, LP_PORTAL_EXTERNAL_URL } from '@/lib/portal/config'

export interface SubModuleConfig {
  id: string
  name: string
  path: string
  icon: React.ElementType
  description: string
}

export interface ModuleGroupConfig {
  id: string
  title: string
  path?: string
  icon?: React.ElementType
  items?: SubModuleConfig[]
}

export interface ModuleConfig {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  path: string
  subModules: SubModuleConfig[]
  groups?: ModuleGroupConfig[]
  requiresPermission?: boolean // Add this
  minLevel?: number // Add this
  /** When true, hidden from App Switcher (replaced by a client design module). */
  hiddenFromSwitcher?: boolean
  /** Dedicated portal URL — staff switcher opens in a new tab instead of in-app route. */
  externalPortalUrl?: string
}

/**
 * Old modules superseded by client-design ports — still routable, hidden from App Switcher.
 */
export const SUPERSEDED_MODULE_IDS = new Set([
  "homepage",
  "employee-hub",
  "portfolio-management",
  "payroll",
  "accounting",
  "accounting-v2",
  "procurement",
  "performance-management",
])

export const MODULE_CONFIG: ModuleConfig[] = [
  {
    id: "homepage",
    name: "Homepage",
    description: "Overview of all modules and quick access",
    icon: CiHome,
    color: "oklch(0.60 0.18 252)",
    path: "/",
    subModules: [],
    hiddenFromSwitcher: true,
  },
  {
    id: "employee-hub",
    name: "Employee Hub",
    description: "Personal home, news, work, people, services and connected apps",
    icon: CiUser,
    color: "oklch(0.65 0.12 200)",
    path: "/employee-hub",
    hiddenFromSwitcher: true,
    subModules: [
      { id: "eh-home", name: "Home", path: "/employee-hub", icon: CiHome, description: "Personal home" },
      { id: "eh-feed", name: "News", path: "/employee-hub/news", icon: CiFileOn, description: "News feed" },
      { id: "eh-newsletters", name: "Newsletters", path: "/employee-hub/newsletters", icon: Mail, description: "Newsletters" },
      { id: "eh-forums", name: "Forums", path: "/employee-hub/forums", icon: CiText, description: "Internal forums" },
      { id: "eh-calendar", name: "Calendar", path: "/employee-hub/calendar", icon: CiCalendar, description: "Personal calendar" },
      { id: "eh-work", name: "My Work", path: "/employee-hub/work", icon: Briefcase, description: "Work and priorities" },
      { id: "eh-performance", name: "Performance", path: "/employee-hub/performance", icon: CiTrophy, description: "My performance" },
      { id: "eh-people", name: "People", path: "/employee-hub/people", icon: Users, description: "People directory" },
      { id: "eh-services", name: "Employee Services", path: "/employee-hub/services", icon: HeartHandshake, description: "Self-service" },
      { id: "eh-apps", name: "Apps", path: "/employee-hub/apps", icon: CiGrid41, description: "Connected apps" },
      { id: "eh-search", name: "AI Search", path: "/employee-hub/search", icon: Sparkles, description: "Universal search" },
    ],
  },
  {
    id: "home",
    name: "Homepage",
    description: "Personal home, news, work, people, services and Matanho AI",
    icon: CiHome,
    color: "oklch(0.55 0.18 255)",
    path: "/home",
    subModules: [
      { id: "hv3-home", name: "Home", path: "/home", icon: CiHome, description: "Personal home" },
      { id: "hv3-cover", name: "Daily Cover", path: "/home/cover", icon: CiFileOn, description: "Daily cover studio" },
      { id: "hv3-news", name: "News", path: "/home/news", icon: CiFileOn, description: "News" },
      { id: "hv3-newsletters", name: "Newsletters", path: "/home/newsletters", icon: Mail, description: "Newsletters" },
      { id: "hv3-forums", name: "Forums", path: "/home/forums", icon: CiText, description: "Forums" },
      { id: "hv3-calendar", name: "Calendar", path: "/home/calendar", icon: CiCalendar, description: "Calendar" },
      { id: "hv3-work", name: "My Work", path: "/home/work", icon: Briefcase, description: "My Work" },
      { id: "hv3-performance", name: "Performance", path: "/home/performance", icon: CiTrophy, description: "Performance" },
      { id: "hv3-people", name: "People", path: "/home/people", icon: Users, description: "People" },
      { id: "hv3-profile", name: "My Profile", path: "/home/profile", icon: CiUser, description: "My Profile" },
      { id: "hv3-services", name: "Services", path: "/home/services", icon: HeartHandshake, description: "Services" },
      { id: "hv3-apps", name: "Apps", path: "/home/apps", icon: CiGrid41, description: "Apps" },
      { id: "hv3-search", name: "Matanho AI", path: "/home/search", icon: Sparkles, description: "Matanho AI" },
    ],
  },
  {
    id: "portfolio-v11",
    name: "Portfolio Management",
    description: "Manage investment portfolios, funds, LPs and reporting",
    icon: CiShop,
    color: "oklch(0.58 0.16 280)",
    path: "/portfolio-v11",
    subModules: [
      { id: "pv11-dashboard", name: "Dashboard", path: "/portfolio-v11", icon: CiGrid41, description: "Dashboard" },
      { id: "pv11-deals", name: "Deal Flow", path: "/portfolio-v11/deals", icon: Briefcase, description: "Deal Flow" },
      { id: "pv11-funds", name: "Funds", path: "/portfolio-v11/funds", icon: CiDollar, description: "Funds" },
      { id: "pv11-capital-calls", name: "Capital Calls", path: "/portfolio-v11/capital-calls", icon: CiCoins1, description: "Capital Calls" },
      { id: "pv11-companies", name: "Portfolio Companies", path: "/portfolio-v11/companies", icon: CiShop, description: "Companies" },
      { id: "pv11-cash-accounts", name: "Fund Accounts", path: "/portfolio-v11/cash-accounts", icon: CiWallet, description: "Client / Fund Accounts" },
      { id: "pv11-reporting", name: "Reporting", path: "/portfolio-v11/reporting", icon: CiCalendar, description: "Reporting Schedules" },
      { id: "pv11-lps", name: "LP Management", path: "/portfolio-v11/lps", icon: Users, description: "LP Management" },
      { id: "pv11-documents", name: "Documents", path: "/portfolio-v11/documents", icon: CiFileOn, description: "Documents Vault" },
      { id: "pv11-settings", name: "Settings", path: "/portfolio-v11/settings", icon: CiSettings, description: "Settings" },
    ],
  },
  {
    id: "portfolio-management",
    name: "Portfolio Management",
    description: "Manage investment portfolios and assets",
    icon: CiShop,
    color: "oklch(0.72 0.12 225)",
    path: "/portfolio",
    hiddenFromSwitcher: true,
    // Flat shortcuts (optional)
    subModules: [
      { id: "Dashboard", name: "Dashboard", path: "/portfolio", icon: CiGrid41, description: "Manage your portfolio" },
      { id: "funds", name: "Funds", path: "/portfolio/funds", icon: CiDollar, description: "Manage funds and investments" },
      { id: "capital-calls", name: "Capital Calls", path: "/portfolio/funds/capital-calls", icon: CiCoins1, description: "Fund investment capital calls" },
      { id: "companies", name: "Companies", path: "/portfolio/companies", icon: CiShop, description: "Manage companies" },
      { id: "reporting-schedule-configs", name: "Reporting Schedules", path: "/portfolio/reporting-schedules", icon: CiCalendar, description: "Manage reporting schedule configurations" },
      { id: "fund-performance-reporting", name: "Fund Performance Reporting", path: "/portfolio/fund-performance-reporting", icon: CiFileOn, description: "GP operations console for LP report templates, schedules, distribution runs and delivery monitoring" },
      { id: "lp-management", name: "LP Management", path: "/portfolio/lp-management", icon: CiUser, description: "Manage LP portal access, vault document publishing and MFA policy" }

    ],
    // Grouped navigation per requirements
    groups: [

      {
        id: "applications",
        title: "Applications",
        items: [
          { id: "applications-dashboard", name: "Dashboard", path: "/portfolio/applications/dashboard", icon: CiViewBoard, description: "Applications dashboard" },
          { id: "applications-all", name: "Applications", path: "/portfolio/applications", icon: CiViewList, description: "Applications" },
          // { id: "applications-due-diligence", name: "Due Diligence", path: "/portfolio/applications/due-diligence", icon: CiViewColumn, description: "Due diligence" },
          // { id: "applications-board-review", name: "Board Review", path: "/portfolio/applications/board-review", icon: CiViewBoard, description: "Board review" },
          // { id: "applications-term-sheet", name: "Term Sheet", path: "/portfolio/applications/term-sheet", icon: CiFileOn, description: "Term sheet" },
          // { id: "applications-disbursement", name: "Fund Disbursement", path: "/portfolio/applications/disbursement", icon: CiViewTimeline, description: "Fund disbursement" }
        ]
      },
      // {
      //   id: "funds",
      //   title: "Funds",
      //   path: "/portfolio/funds",


      // },
      // { id: "companies-page", title: "Companies", path: "/portfolio/companies" },

      // {
      //   id: "companies",
      //   title: "Companies",
      //   path: "/portfolio/companies",


      // },
      // {
      //   id: "companies",
      //   title: "Companies",
      //   items: [
      //     { id: "companies-page", name: "Companies", path: "/portfolio/companies", icon: CiShop, description: "Companies" },
      //     { id: "companies-performance", name: "Performance Dashboard", path: "/portfolio/companies/performance", icon: CiGrid41, description: "Company performance" },
      //     { id: "companies-updates", name: "Quarterly Updates", path: "/portfolio/companies/updates", icon: CiCalendar, description: "Quarterly updates" }
      //   ]
      // }
    ]
  },
  {
    id: "performance-management",
    name: "Performance Management",
    description: "Performance tracking and reporting",
    icon: CiViewTimeline,
    color: "oklch(0.58 0.09 260)",
    path: "/performance",
    hiddenFromSwitcher: true,
    subModules: [
      { id: "performance-dashboard", name: "Dashboard", path: "/performance", icon: CiGrid41, description: "Overview and metrics" },
      { id: "config-strategy", name: "Company Strategy", path: "/performance/configuration/strategy", icon: CiFileOn, description: "Vision and strategy cycles" },
      { id: "config-themes", name: "Themes", path: "/performance/configuration/themes", icon: CiViewTable, description: "Strategic themes and goal tagging" },
      { id: "performance-contracts", name: "Performance Contracts", path: "/performance/contracts", icon: CiMedal, description: "CEO, Board, Department and Employee BSC contracts" },
      { id: "goals-management", name: "Goals", path: "/performance/goals", icon: CiCircleCheck, description: "Goals" },
      { id: "tasks-management", name: "Tasks", path: "/performance/tasks", icon: CiViewList, description: "Tasks" },
      { id: "performance-reviews", name: "Reviews", path: "/performance/reviews", icon: CiFileOn, description: "Unified hub for self-assessments, evaluations, cycles and reports" },
    ],
    groups: [
      {
        id: "scorecards",
        title: "Scorecards",
        icon: IoStatsChartOutline,
        items: [
          { id: "org-bsc", name: "Org BSC", path: "/performance/org-bsc", icon: CiGrid41, description: "Organisational BSC dashboard" },
          { id: "department-scorecards", name: "Department Scorecards", path: "/performance/department-scorecards", icon: CiViewBoard, description: "Department performance scorecards" },
          { id: "board-scorecards", name: "Board Scorecards", path: "/performance/board-scorecards", icon: IoStatsChartOutline, description: "Board contract scorecards" },
          { id: "ceo-scorecards", name: "CEO Scorecards", path: "/performance/ceo-scorecards", icon: CiTrophy, description: "CEO contract scorecards" },
          { id: "user-scorecards", name: "Employee Scorecards", path: "/performance/user-scorecards", icon: CiViewTable, description: "User performance scorecards" },
        ]
      },
      {
        id: "perf-configuration",
        title: "Configuration",
        icon: CiSettings,
        items: [
          { id: "kpi-management", name: "KPI Management", path: "/performance/kpis", icon: CiViewTimeline, description: "KPIs" },
          { id: "bsc-entry", name: "BSC Entry", path: "/performance/tasks?tab=bsc-entry", icon: CiCoins1, description: "BSC data entry hub" },
          { id: "workflow-history", name: "Workflow History", path: "/performance/tasks?tab=workflow", icon: CiViewTable, description: "Workflow submissions and history" },
          { id: "departments-management", name: "Departments", path: "/performance/departments", icon: CiUser, description: "Department management" },
          { id: "config-pillars", name: "BSC Pillars", path: "/performance/configuration/pillars", icon: CiViewBoard, description: "BSC pillars and goal weights" },
        ]
      }
    ]
  },
  {
    id: "performance-v22",
    name: "Performance Management",
    description: "Matanho Performance Management — command centre, scorecards, reviews and compliance",
    icon: CiViewTimeline,
    color: "oklch(0.55 0.16 280)",
    path: "/performance-v22",
    subModules: [
      { id: "pm22-dashboard", name: "Command Centre", path: "/performance-v22", icon: CiGrid41, description: "Command Centre" },
      { id: "pm22-strategy", name: "Company Strategy", path: "/performance-v22/strategy", icon: CiFileOn, description: "Company Strategy" },
      { id: "pm22-scorecards", name: "Scorecards", path: "/performance-v22/scorecards", icon: CiViewTable, description: "Scorecards" },
      { id: "pm22-objectives", name: "Objectives & KPIs", path: "/performance-v22/objectives", icon: CiCircleCheck, description: "Objectives & KPIs" },
      { id: "pm22-tasks", name: "Tasks & Projects", path: "/performance-v22/tasks", icon: CiViewList, description: "Tasks & Projects" },
      { id: "pm22-reviews", name: "Performance Reviews", path: "/performance-v22/reviews", icon: CiFileOn, description: "Performance Reviews" },
      { id: "pm22-corrective", name: "Corrective Actions", path: "/performance-v22/corrective", icon: CiViewTimeline, description: "Corrective Actions" },
      { id: "pm22-reports", name: "Reports & Compliance", path: "/performance-v22/reports", icon: CiViewTable, description: "Reports & Compliance" },
      { id: "pm22-vault", name: "Document Vault", path: "/performance-v22/vault", icon: CiFileOn, description: "Document Vault" },
      { id: "pm22-alerts", name: "Alerts & Audit", path: "/performance-v22/alerts", icon: CiBellOn, description: "Alerts & Audit" },
      { id: "pm22-access", name: "Access & Settings", path: "/performance-v22/access", icon: CiSettings, description: "Access & Settings" },
    ]
  },
  {
    id: "payroll",
    name: "Payroll",
    description: "Payroll management",
    icon: CiDollar,
    color: "oklch(0.54 0.1 280)",
    path: "/payroll",
    hiddenFromSwitcher: true,
    subModules: [
      { id: "payroll-dashboard", name: "Dashboard", path: "/payroll", icon: CiGrid41, description: "Payroll dashboard" },
      { id: "payroll-employees", name: "Employees", path: "/payroll/employees", icon: CiViewList, description: "Employees" },
      { id: "payroll-runs", name: "Pay Runs", path: "/payroll/runs", icon: CiCalendar, description: "Pay runs" },
      { id: "payroll-payslips", name: "Payslips", path: "/payroll/payslips", icon: CiFileOn, description: "Search payslips" },
      { id: "payroll-tax-rules", name: "Tax Rules", path: "/payroll/tax-rules", icon: CiDollar, description: "Tax rules management" },
      { id: "payroll-allowance-types", name: "Allowance Types", path: "/payroll/allowance-types", icon: CiViewTable, description: "Allowance types" },
      { id: "payroll-deduction-types", name: "Deduction Types", path: "/payroll/deduction-types", icon: CiViewTable, description: "Deduction types" },
      { id: "payroll-bank-templates", name: "Bank Templates", path: "/payroll/bank-templates", icon: CiViewTable, description: "Bank file templates" }
    ]
  },
  {
    id: "payroll-v6",
    name: "Payroll",
    description: "Payroll, tax, leave, vault and employee self-service",
    icon: CiDollar,
    color: "oklch(0.52 0.14 255)",
    path: "/payroll-v6",
    subModules: [
      { id: "pr6-overview", name: "Command Centre", path: "/payroll-v6", icon: CiGrid41, description: "Command Centre" },
      { id: "pr6-employees", name: "Employees", path: "/payroll-v6/employees", icon: CiViewList, description: "Employees" },
      { id: "pr6-runs", name: "Payroll Runs", path: "/payroll-v6/runs", icon: CiCalendar, description: "Payroll runs" },
      { id: "pr6-approvals", name: "Approvals", path: "/payroll-v6/approvals", icon: CiFileOn, description: "Maker-checker review" },
      { id: "pr6-tax", name: "Tax & Statutory", path: "/payroll-v6/tax", icon: CiDollar, description: "Tax & statutory rules" },
      { id: "pr6-leave", name: "Leave & Benefits", path: "/payroll-v6/leave", icon: HeartHandshake, description: "Leave & benefits" },
      { id: "pr6-vault", name: "Document Vault", path: "/payroll-v6/vault", icon: CiFileOn, description: "Document vault" },
      { id: "pr6-reports", name: "Reports", path: "/payroll-v6/reports", icon: CiViewTable, description: "Compliance reports" },
      { id: "pr6-settings", name: "Settings", path: "/payroll-v6/settings", icon: CiSettings, description: "Settings & integrations" },
      { id: "pr6-mypay", name: "My Pay", path: "/payroll-v6/mypay", icon: CiWallet, description: "My Pay" },
    ]
  },
  {
    id: "procurement-v23",
    name: "Procurement",
    description: "Procurement & tender management — client V23 faithful port",
    icon: CiViewList,
    color: "oklch(0.56 0.10 220)",
    path: "/procurement-v23",
    subModules: [
      { id: "pr23-dashboard", name: "Command Centre", path: "/procurement-v23", icon: CiGrid41, description: "Command Centre" },
      { id: "pr23-plan", name: "Annual Procurement Plan", path: "/procurement-v23/plan", icon: CiCalendar, description: "Annual procurement plan" },
      { id: "pr23-approvals", name: "Approval Centre", path: "/procurement-v23/approvals", icon: CiFileOn, description: "Approval centre" },
      { id: "pr23-requisitions", name: "Purchase Requisitions", path: "/procurement-v23/requisitions", icon: CiFileOn, description: "Purchase requisitions" },
      { id: "pr23-tenders", name: "Tenders & RFx", path: "/procurement-v23/tenders", icon: CiShop, description: "Tenders and RFx" },
      { id: "pr23-evaluation", name: "Bid Evaluation", path: "/procurement-v23/evaluation", icon: CiViewTimeline, description: "Bid evaluation" },
      { id: "pr23-vendors", name: "Vendor Registry", path: "/procurement-v23/vendors", icon: CiUser, description: "Vendor registry" },
      { id: "pr23-contracts", name: "Contracts & Awards", path: "/procurement-v23/contracts", icon: CiFileOn, description: "Contracts and awards" },
      { id: "pr23-orders", name: "Purchase Orders", path: "/procurement-v23/purchase-orders", icon: CiShop, description: "Purchase orders" },
      { id: "pr23-receiving", name: "Receiving & Inspection", path: "/procurement-v23/goods-received", icon: CiViewTimeline, description: "Goods received" },
      { id: "pr23-invoices", name: "Invoices & 3-Way Match", path: "/procurement-v23/invoices", icon: CiWallet, description: "Invoices and matching" },
      { id: "pr23-accounts", name: "Accounts & Asset Transfers", path: "/procurement-v23/accounts", icon: CiMoneyCheck1, description: "Accounts and transfers" },
      { id: "pr23-documents", name: "Document Vault", path: "/procurement-v23/documents", icon: CiFileOn, description: "Document vault" },
      { id: "pr23-reports", name: "Reports Vault", path: "/procurement-v23/reports", icon: CiViewTable, description: "Reports vault" },
      { id: "pr23-audit", name: "Audit & Compliance", path: "/procurement-v23/audit", icon: CiViewBoard, description: "Audit and compliance" },
      { id: "pr23-settings", name: "Configuration & RBAC", path: "/procurement-v23/settings", icon: CiSettings, description: "Settings and RBAC" },
    ],
  },
  {
    id: "accounting-v52",
    name: "Accounting",
    description: "Accounting operating system — client V52 faithful port",
    icon: CiDollar,
    color: "oklch(0.55 0.14 255)",
    path: "/accounting-v52",
    subModules: [
      { id: "ac52-overview", name: "Command Centre", path: "/accounting-v52", icon: CiGrid41, description: "Accounting Command Centre" },
      { id: "ac52-approvals", name: "Approval Queue", path: "/accounting-v52/approvals", icon: CiFileOn, description: "Approval queue" },
      { id: "ac52-close", name: "Period Close", path: "/accounting-v52/close", icon: CiCalendar, description: "Period close" },
      { id: "ac52-ledger", name: "General Ledger", path: "/accounting-v52/general-ledger", icon: CiFileOn, description: "General ledger" },
      { id: "ac52-journals", name: "Journal Entries", path: "/accounting-v52/journals", icon: CiFileOn, description: "Journal entries" },
      { id: "ac52-cash", name: "Cash & Liquidity", path: "/accounting-v52/cash-book", icon: CiMoneyCheck1, description: "Cash book" },
      { id: "ac52-recon", name: "Bank Reconciliation", path: "/accounting-v52/bank-reconciliation", icon: CiViewTimeline, description: "Bank reconciliation" },
      { id: "ac52-payables", name: "Payables & Payments", path: "/accounting-v52/payables", icon: CiUser, description: "Payables" },
      { id: "ac52-receivables", name: "Receivables", path: "/accounting-v52/receivables", icon: CiUser, description: "Receivables" },
      { id: "ac52-expenses", name: "Expenses & Claims", path: "/accounting-v52/expenses", icon: IoReceiptOutline, description: "Expenses and claims" },
      { id: "ac52-inventory", name: "Inventory Accounting", path: "/accounting-v52/inventory", icon: CiShop, description: "Inventory" },
      { id: "ac52-assets", name: "Fixed Assets", path: "/accounting-v52/assets", icon: CiViewBoard, description: "Fixed assets" },
      { id: "ac52-investments", name: "Short-Term Investments", path: "/accounting-v52/short-term-investments", icon: CiCoins1, description: "Short-term investments" },
      { id: "ac52-reports", name: "Financial Reports", path: "/accounting-v52/reports", icon: CiViewTable, description: "Financial reports" },
      { id: "ac52-compliance", name: "Compliance & Tax", path: "/accounting-v52/tax", icon: CiFileOn, description: "Compliance and tax" },
      { id: "ac52-fx", name: "FX Revaluation", path: "/accounting-v52/fx-revaluation", icon: CiDollar, description: "FX revaluation" },
      { id: "ac52-consolidation", name: "Group Consolidation", path: "/accounting-v52/consolidation", icon: CiViewBoard, description: "Consolidation" },
      { id: "ac52-coa", name: "Chart of Accounts", path: "/accounting-v52/chart-governance", icon: CiSettings, description: "Chart governance" },
      { id: "ac52-vault", name: "Document Vault", path: "/accounting-v52/vault", icon: CiFileOn, description: "Document vault" },
      { id: "ac52-audit", name: "Audit Trail", path: "/accounting-v52/audit", icon: CiViewBoard, description: "Audit trail" },
      { id: "ac52-access", name: "Access Control", path: "/accounting-v52/access", icon: CiUser, description: "Access control" },
      { id: "ac52-integrations", name: "Integrations", path: "/accounting-v52/integrations", icon: CiGrid41, description: "Integrations" },
      { id: "ac52-settings", name: "Settings", path: "/accounting-v52/settings", icon: CiSettings, description: "Settings" },
    ],
  },
  {
    id: "procurement",
    name: "Procurement",
    description: "Procurement operations",
    icon: CiViewList,
    color: "oklch(0.56 0.10 220)",
    path: "/procurement",
    subModules: [
      { id: "procurement-dashboard", name: "Dashboard", path: "/procurement", icon: CiGrid41, description: "Procurement dashboard" },
      { id: "purchase-requisitions", name: "Purchase Requisitions", path: "/procurement/requisitions", icon: CiFileOn, description: "Purchase requisitions management" },
      { id: "rfq", name: "RFQ", path: "/procurement/rfq", icon: CiFileOn, description: "Purchase requisitions management" },
      { id: "quotations", name: "Quotations", path: "/procurement/quotations", icon: CiShop, description: "Quotations management" },
      { id: "purchase-orders", name: "Purchase Orders", path: "/procurement/purchase-orders", icon: CiShop, description: "Purchase orders management" },
      { id: "procurement-invoices", name: "Invoices", path: "/procurement/invoices", icon: CiWallet, description: "Procurement invoices management" },
      { id: "goods-received-notes", name: "Goods Received Notes", path: "/procurement/goods-received", icon: CiViewTimeline, description: "Goods received notes management" },
      { id: "payments", name: "Payments", path: "/procurement/payments", icon: CiViewTimeline, description: "Payments management" },
      { id: "ai-intake", name: "AI Invoice Intake", path: "/procurement/ai-intake", icon: FileText, description: "AI-powered vendor invoice extraction and verification" },
      { id: "three-way-match", name: "3-Way Match", path: "/procurement/three-way-match", icon: BarChart3, description: "PO vs GRN vs Invoice matching" },
      { id: "cfo-dashboard", name: "CFO Dashboard", path: "/procurement/cfo-dashboard", icon: TrendingUp, description: "Executive procurement overview and analytics" },
      { id: "approval-configurations", name: "Approval Configurations", path: "/procurement/approval-configs", icon: CiSettings, description: "Approval workflow configurations" },
      // { id: "approval-requests", name: "My Approvals", path: "/procurement/approvals", icon: CiCircleCheck, description: "Pending approval requests" }
    ]
  },
  {
    id: "accounting",
    name: "Accounting",
    description: "Accounting and financial operations",
    icon: CiDollar,
    color: "oklch(0.62 0.10 170)",
    path: "/accounting",
    hiddenFromSwitcher: true,
    subModules: [
      { id: "accounting-dashboard", name: "Dashboard", path: "/accounting", icon: CiGrid41, description: "Accounting dashboard" },
      { id: "general-ledger", name: "General Ledger", path: "/accounting/general-ledger", icon: CiFileOn, description: "Chart of accounts and journal entries" },
      {
        id: "cash-book",
        name: "Cash Book",
        path: "/accounting/cash-book",
        icon: CiMoneyCheck1,
        description: "Cash book management",

      },

      { id: "invoices", name: "Sales", path: "/accounting/invoices", icon: CiUser, description: "Customer invoices and payments" },
      { id: "payables", name: "Purchases", path: "/accounting/payables", icon: CiUser, description: "Supplier bills and payments" },

      // { id: "accounts-receivable", name: "Accounts Receivable", path: "/accounting/debtors", icon: CiUser, description: "Customer invoices and payments" },
      // { id: "accounts-payable", name: "Accounts Payable", path: "/accounting/creditors", icon: CiWallet, description: "Supplier bills and payments" },
      { id: "bank-reconciliation", name: "Bank Reconciliation", path: "/accounting/bank-reconciliation", icon: CiViewTimeline, description: "Match bank statements" },
      { id: "expenses", name: "Expenses", path: "/accounting/expenses", icon: IoReceiptOutline, description: "Expense Management" },

      { id: "inventory-accounting", name: "Inventory", path: "/accounting/inventory", icon: CiShop, description: "Stock management and COGS" },

      { id: "asset-management", name: "Asset Management", path: "/accounting/assets", icon: CiViewBoard, description: "Fixed assets and depreciation" },
      { id: "short-term-investments", name: "Short-Term Investments", path: "/accounting/short-term-investments", icon: CiCoins1, description: "Track and manage short-term liquid investments" },
      { id: "financial-reports", name: "Financial Reports", path: "/accounting/reports", icon: CiViewTable, description: "Financial statements and analytics" },

      { id: "accounting-settings", name: "Settings", path: "/accounting/settings", icon: CiSettings, description: "Chart of accounts and configuration" },
    ]
  },
  {
    id: "accounting-v2",
    name: "Accounting",
    description: "Accounting Command Centre, GL, cash, close and reports",
    icon: CiDollar,
    color: "oklch(0.55 0.14 255)",
    path: "/accounting-v2",
    subModules: [
      { id: "ac-dashboard", name: "Command Centre", path: "/accounting-v2", icon: CiGrid41, description: "Accounting Command Centre" },
      { id: "ac-gl", name: "General Ledger", path: "/accounting-v2/general-ledger", icon: CiFileOn, description: "General Ledger Explorer" },
      { id: "ac-journal", name: "Journal Entry", path: "/accounting-v2/journals/new", icon: CiFileOn, description: "Journal Entry Maker-Checker" },
      { id: "ac-cash", name: "Cash Book", path: "/accounting-v2/cash-book", icon: CiMoneyCheck1, description: "Cash Book" },
      { id: "ac-recon", name: "Bank Reconciliation", path: "/accounting-v2/bank-reconciliation", icon: CiViewTimeline, description: "Bank Reconciliation" },
      { id: "ac-purchases", name: "Invoice Match", path: "/accounting-v2/payables/match", icon: CiUser, description: "Invoice three-way match" },
      { id: "ac-sales", name: "Receivables", path: "/accounting-v2/receivables", icon: CiUser, description: "Receivables / Collections" },
      { id: "ac-inventory", name: "Inventory", path: "/accounting-v2/inventory", icon: CiShop, description: "Inventory valuation" },
      { id: "ac-assets", name: "Fixed Assets", path: "/accounting-v2/assets", icon: CiViewBoard, description: "Fixed Assets" },
      { id: "ac-sti", name: "Short-Term Investments", path: "/accounting-v2/short-term-investments", icon: CiCoins1, description: "Short-Term Investments" },
      { id: "ac-reports", name: "Financial Reports", path: "/accounting-v2/reports", icon: CiViewTable, description: "Financial Reports builder" },
      { id: "ac-close", name: "Month-End Close", path: "/accounting-v2/close", icon: CiCalendar, description: "Month-End Close" },
      { id: "ac-expenses", name: "Expenses & Claims", path: "/accounting-v2/expenses", icon: IoReceiptOutline, description: "Expenses & Claims" },
      { id: "ac-settings", name: "Chart Governance", path: "/accounting-v2/chart-governance", icon: CiSettings, description: "Chart Governance" },
      { id: "ac-tax", name: "Tax Return Pack", path: "/accounting-v2/tax", icon: CiFileOn, description: "Tax Return Pack" },
      { id: "ac-fx", name: "FX Revaluation", path: "/accounting-v2/fx-revaluation", icon: CiDollar, description: "FX Revaluation" },
      { id: "ac-consolidation", name: "Consolidation", path: "/accounting-v2/consolidation", icon: CiViewBoard, description: "Consolidation" },
      { id: "ac-payment-run", name: "Payment Run", path: "/accounting-v2/payment-run", icon: CiMoneyCheck1, description: "Payment Run" },
    ],
  },
  {
    id: "events-management",
    name: "Events",
    description: "Manage investor relations and fundraising events",
    icon: CiCalendar,
    color: "oklch(0.68 0.12 240)", // a subtle blue tone for events
    path: "/events",
    subModules: [
      {
        id: "events-dashboard",
        name: "Dashboard",
        path: "/events",
        icon: CiGrid41,
        description: "Upcoming events and KPIs overview",
      },
      {
        id: "my-events",
        name: "My Events",
        path: "/events/my-events",
        icon: CiGift,
        description: "Events you are hosting or managing",
      },
      // {
      //   id: "my-invitations",
      //   name: "My Invitations",
      //   path: "/events/invitations",
      //   icon: IoPeopleOutline,
      //   description: "Events you are invited to attend",
      // },
      // {
      //   id: "event-analytics",
      //   name: "Analytics",
      //   path: "/events/analytics",
      //   icon: IoStatsChartOutline,
      //   description: "Event KPIs, RSVP rates, and performance insights",
      // },
      // venues
      // {
      //   id: "event-venues",
      //   name: "Venues",
      //   path: "/events/venues",
      //   icon: CiMapPin,
      //   description: "Manage event venues and locations",
      // },
      // {
      //   id: "event-settings",
      //   name: "Settings",
      //   path: "/events/settings",
      //   icon: CiViewList,
      //   description: "Access control and event module configuration",
      // },
    ],
  },

  //admin-management
  {
    id: "admin-management",
    name: "Admin Management",
    path: "/admin",
    icon: CiUser,
    description: "User and role management",
    color: "oklch(0.68 0.12 240)", // a subtle blue tone for events
    subModules: [
      { id: "admin-dashboard", name: "Admin Dashboard", path: "/admin", icon: CiGrid41, description: "Admin overview and metrics" },

      {
        id: "user-management",
        name: "User Management",
        path: "/admin/users",
        icon: CiUser,
        description: "Manage users and their roles",
      },
      {
        id: "role-management",
        name: "Role Management",
        path: "/admin/roles",
        icon: CiLock,
        description: "Manage user roles and permissions",
      },
      {
        id: "voting-members",
        name: "Board Review Voting",
        path: "/admin/configs/voting-members",
        icon: CiUser,
        description: "Manage board review voting members",
      },
      {
        id: "company-addresses",
        name: "Company Addresses",
        path: "/admin/addresses",
        icon: CiMapPin,
        description: "Manage company addresses used on report letterheads",
      },
    ],
  },

  // investments — Arcus Investment Operations terminal
  {
    id: "investments",
    name: "Investments",
    description: "Institutional investment operations, portfolio, and order management terminal",
    icon: CandlestickChart,
    color: "oklch(0.50 0.16 160)",
    path: "/investments-v2",
    subModules: [
      { id: "investments-dashboard", name: "Dashboard", path: "/investments-v2", icon: LayoutDashboard, description: "Investment operations overview" },
    ],
    groups: [
      {
        id: "investments-portfolios",
        title: "Portfolios",
        icon: Briefcase,
        path: "/investments-v2/portfolios",
        items: [
          { id: "investments-portfolios-overview",     name: "Overview",      path: "/investments-v2/portfolios",              icon: CiGrid41,   description: "Portfolio overview" },
          { id: "investments-portfolios-instruments",  name: "Instruments",   path: "/investments-v2/portfolios/instruments",  icon: CiGrid41,   description: "Securities master registry" },
          { id: "investments-portfolios-prices",       name: "Prices",        path: "/investments-v2/portfolios/prices",       icon: CiViewTimeline, description: "Live prices, validation, ingest" },
          { id: "investments-portfolios-positions",    name: "Positions",     path: "/investments-v2/portfolios/positions",    icon: CiViewList, description: "Portfolio positions" },
          { id: "investments-portfolios-transactions", name: "Transactions",  path: "/investments-v2/portfolios/transactions", icon: CiFileOn,   description: "Portfolio transactions" },
          { id: "investments-portfolios-folder-setup", name: "Folder Setup",  path: "/investments-v2/portfolios/folder-setup", icon: CiSettings, description: "Portfolio folder configuration" },
          { id: "investments-portfolios-setup",        name: "Setup",         path: "/investments-v2/portfolios/setup",        icon: CiSettings, description: "Portfolio-level configuration" },
        ],
      },
      {
        id: "investments-orders",
        title: "Orders",
        icon: ClipboardList,
        path: "/investments-v2/orders",
        items: [
          { id: "investments-orders-blotter",    name: "Trade Blotter", path: "/investments-v2/orders/blotter",    icon: CiFileOn,       description: "Trade executions and routing status" },
          { id: "investments-orders-orderbook",  name: "Orderbook",     path: "/investments-v2/orders/orderbook",  icon: CiViewList,     description: "Order book" },
          { id: "investments-orders-trading",    name: "Trading",       path: "/investments-v2/orders/trading",    icon: Monitor,        description: "Trading workspace" },
          { id: "investments-orders-compliance", name: "Compliance",    path: "/investments-v2/orders/compliance", icon: CiCircleCheck,  description: "Pre/post-trade compliance" },
          { id: "investments-orders-simulation", name: "Simulation",    path: "/investments-v2/orders/simulation", icon: CiViewTimeline, description: "Order simulation" },
          { id: "investments-orders-models",     name: "Models",        path: "/investments-v2/orders/models",     icon: CiGrid41,       description: "Trading models" },
          { id: "investments-orders-setup",      name: "Setup",         path: "/investments-v2/orders/setup",      icon: CiSettings,     description: "Order configuration and investment administration" },
        ],
      },
      {
        id: "investments-reconciliation",
        title: "Reconciliation",
        icon: Scale,
        path: "/investments-v2/reconciliation/trade",
        items: [
          { id: "investments-reconciliation-overview", name: "Reconciliation Overview", path: "/investments-v2/reconciliation", icon: CiGrid41, description: "Us × Broker × Bank control panel" },
          { id: "investments-reconciliation-trade", name: "Trade Match", path: "/investments-v2/reconciliation/trade", icon: CiGrid41, description: "Us blotter × broker × bank/custodian trade match" },
          { id: "investments-reconciliation-fund-cash", name: "Cash Match", path: "/investments-v2/reconciliation/fund-cash", icon: CiGrid41, description: "Our cash ledger vs bank statement" },
          { id: "investments-reconciliation-positions", name: "Positions", path: "/investments-v2/reconciliation/positions", icon: CiGrid41, description: "Holdings vs settled trades breaks" },
          { id: "investments-reconciliation-cash-ledger", name: "Cash Ledger", path: "/investments-v2/reconciliation/cash-ledger", icon: CiGrid41, description: "Trading and fund cash ledgers" },
          { id: "investments-reconciliation-exceptions", name: "Exceptions", path: "/investments-v2/reconciliation/exceptions", icon: CiGrid41, description: "Reconciliation exceptions and approvals" },
          { id: "investments-reconciliation-statements", name: "Client Statements", path: "/investments-v2/reconciliation/statements", icon: CiGrid41, description: "Investor and client cash statements" },
        ],
      },
      {
        id: "investments-valuation",
        title: "Valuation",
        icon: TrendingUp,
        path: "/investments-v2/valuation",
        items: [
          { id: "investments-valuation-nav",   name: "NAV Runs",         path: "/investments-v2/valuation", icon: CiGrid41, description: "NAV calculation runs" },
          { id: "investments-valuation-pnl",   name: "P&L Runs",         path: "/investments-v2/valuation", icon: CiGrid41, description: "P&L calculation runs" },
          { id: "investments-valuation-price", name: "Price Validation", path: "/investments-v2/valuation", icon: CiGrid41, description: "Price validation runs" },
          { id: "investments-valuation-fx",    name: "FX Conversion",    path: "/investments-v2/valuation", icon: CiGrid41, description: "FX conversion runs" },
          { id: "investments-valuation-exceptions", name: "Valuation Exceptions", path: "/investments-v2/valuation", icon: CiGrid41, description: "Valuation exceptions" },
        ],
      },
      {
        id: "investments-reporting",
        title: "Reporting",
        icon: BarChart3,
        path: "/investments-v2/reporting",
        items: [
          { id: "investments-reporting-portfolio", name: "Portfolio Reports", path: "/investments-v2/reporting", icon: CiGrid41, description: "Portfolio reports" },
          { id: "investments-reporting-pnl",       name: "P&L Reports",       path: "/investments-v2/reporting", icon: CiGrid41, description: "P&L reports" },
          { id: "investments-reporting-allocation", name: "Allocation Reports", path: "/investments-v2/reporting", icon: CiGrid41, description: "Asset allocation reports" },
          { id: "investments-reporting-compliance", name: "Compliance Reports", path: "/investments-v2/reporting", icon: CiGrid41, description: "Compliance reports" },
          { id: "investments-reporting-trade",     name: "Trade Reports",     path: "/investments-v2/reporting", icon: CiGrid41, description: "Trade reports" },
          { id: "investments-reporting-reconciliation", name: "Reconciliation Reports", path: "/investments-v2/reporting", icon: CiGrid41, description: "Reconciliation reports" },
          { id: "investments-reporting-investor", name: "Investor Reports", path: "/investments-v2/reporting", icon: CiGrid41, description: "Investor reports" },
        ],
      },
      {
        id: "investments-documentation",
        title: "Documentation",
        icon: FileText,
        path: "/investments-v2/documentation",
        items: [
          { id: "investments-documentation-broker-confirmations", name: "Broker Confirmations", path: "/investments-v2/documentation", icon: CiGrid41, description: "Broker confirmation documents" },
          { id: "investments-documentation-custodian-statements", name: "Custodian Statements", path: "/investments-v2/documentation", icon: CiGrid41, description: "Custodian statement documents" },
          { id: "investments-documentation-approvals", name: "Approvals", path: "/investments-v2/documentation", icon: CiGrid41, description: "Investment and compliance approval documents" },
          { id: "investments-documentation-mandates", name: "Mandates", path: "/investments-v2/documentation", icon: CiGrid41, description: "Investment mandate documents" },
          { id: "investments-documentation-audit", name: "Audit Documents", path: "/investments-v2/documentation", icon: CiGrid41, description: "Audit documents" },
        ],
      },
      {
        id: "investments-accounting",
        title: "Accounting",
        icon: Calculator,
        path: "/investments-v2/accounting",
        items: [
          { id: "investments-accounting-events", name: "Accounting Events", path: "/investments-v2/accounting", icon: CiGrid41, description: "Accounting events" },
          { id: "investments-accounting-journals", name: "Journals", path: "/investments-v2/accounting", icon: CiGrid41, description: "GL journals" },
          { id: "investments-accounting-ledger-exports", name: "Ledger Exports", path: "/investments-v2/accounting", icon: CiGrid41, description: "Ledger exports" },
        ],
      },
    ],
  },

  // street-rates
  {
    id: "street-rates",
    name: "Street Rates",
    description: "Street vs official USD/ZWG exchange rate intelligence",
    icon: ArrowLeftRight,
    color: "oklch(0.72 0.16 80)",
    path: "/street-rates",
    subModules: [
      { id: "street-rates-dashboard", name: "Dashboard",      path: "/street-rates",        icon: ArrowLeftRight, description: "Live street vs official rate dashboard" },
      { id: "street-rates-config",    name: "Configuration",  path: "/street-rates/config", icon: CiSettings,     description: "Display config, manual overrides, and ingest control" },
    ],
  },

  // FP&A — Planning, Budgeting, Forecasting, Scenario Modelling
  {
    id: "forecasting",
    name: "FP&A",
    description: "Planning, budgeting, forecasting and scenario modelling",
    icon: TrendingUp,
    color: "oklch(0.55 0.18 255)",
    path: "/forecasting",
    subModules: [
      { id: "fpa-home", name: "Home", path: "/forecasting", icon: CiHome, description: "FP&A executive board" },
      { id: "fpa-models", name: "Model Planning", path: "/forecasting/models", icon: CiBoxes, description: "Planning models and worksheets" },
      { id: "fpa-model-builder", name: "Model Builder", path: "/forecasting/model-builder", icon: Settings, description: "Configure planning models" },
      { id: "fpa-budget", name: "Budgeting", path: "/forecasting/budget", icon: CiWallet, description: "Annual budgeting cycles" },
      { id: "fpa-rolling", name: "Forecasts", path: "/forecasting/rolling-forecast", icon: TrendingUp, description: "Rolling forecasts" },
      { id: "fpa-drivers", name: "Assumptions", path: "/forecasting/drivers", icon: CiText, description: "Assumptions and drivers" },
      { id: "fpa-workforce", name: "Workforce", path: "/forecasting/workforce", icon: Users, description: "Workforce planning" },
      { id: "fpa-revenue", name: "Revenue", path: "/forecasting/revenue", icon: DollarSign, description: "Revenue planning" },
      { id: "fpa-expenses", name: "Expenses", path: "/forecasting/expenses", icon: Receipt, description: "Expense planning" },
      { id: "fpa-cashflow", name: "Cash Flow", path: "/forecasting/cash-flow", icon: CiCoins1, description: "Cash flow planning" },
      { id: "fpa-variance", name: "Variance", path: "/forecasting/variance", icon: BarChart3, description: "Actuals vs budget vs forecast" },
      { id: "fpa-reports", name: "Reports", path: "/forecasting/reports", icon: FileText, description: "Management reports" },
      { id: "fpa-workflow", name: "Workflow", path: "/forecasting/workflow", icon: CiCircleCheck, description: "Tasks and approvals" },
      { id: "fpa-settings", name: "Settings", path: "/forecasting/settings", icon: CiSettings, description: "FP&A configuration" },
    ],
  },

  // Fundraising & Investor Relations — Mandate Origination
  {
    id: "fundraising",
    name: "Fundraising & Investor Relations",
    description: "Campaigns, pipeline, mandates, commitments and investor onboarding",
    icon: Handshake,
    color: "oklch(0.52 0.14 250)",
    path: "/fundraising",
    subModules: [
      { id: "fr-dashboard", name: "Dashboard", path: "/fundraising", icon: CiHome, description: "Executive fundraising overview" },
      { id: "fr-campaigns", name: "Campaigns", path: "/fundraising/campaigns", icon: Briefcase, description: "Fundraise and mandate campaigns" },
      { id: "fr-investors", name: "Investor Organisations", path: "/fundraising/investors", icon: Building2, description: "Institutional investor database" },
      { id: "fr-contacts", name: "Contacts", path: "/fundraising/contacts", icon: Contact, description: "People across investor organisations" },
      { id: "fr-pipeline", name: "Pipeline", path: "/fundraising/pipeline", icon: Kanban, description: "Stage-gated opportunity pipeline" },
      { id: "fr-mandates", name: "Mandates & RFPs", path: "/fundraising/mandates", icon: ClipboardCheck, description: "Asset-management mandates and tenders" },
      { id: "fr-due-diligence", name: "Due Diligence", path: "/fundraising/due-diligence", icon: ScrollText, description: "DDQs, evidence and follow-ups" },
      { id: "fr-data-rooms", name: "Data Rooms", path: "/fundraising/data-rooms", icon: FolderLock, description: "Secure document rooms and access" },
      { id: "fr-communications", name: "Communications", path: "/fundraising/communications", icon: Mail, description: "Outreach and interaction log" },
      { id: "fr-meetings", name: "Meetings & Tasks", path: "/fundraising/meetings", icon: CalendarDays, description: "Meetings, actions and follow-ups" },
      { id: "fr-documents", name: "Documents", path: "/fundraising/documents", icon: FileText, description: "Fundraising document library" },
      { id: "fr-agreements", name: "Agreements & Signatures", path: "/fundraising/agreements", icon: FileSignature, description: "Agreements and e-signatures" },
      { id: "fr-commitments", name: "Commitments & Closings", path: "/fundraising/commitments", icon: CircleDollarSign, description: "Commitments, admissions and closes" },
      { id: "fr-onboarding", name: "Client Onboarding", path: "/fundraising/onboarding", icon: UserCheck, description: "KYC and mandate activation" },
      { id: "fr-placement-agents", name: "Placement Agents", path: "/fundraising/placement-agents", icon: Users, description: "Agent appointments and commissions" },
      { id: "fr-forecasts", name: "Forecasts & Analytics", path: "/fundraising/forecasts", icon: LineChart, description: "Weighted pipeline and fee forecasts" },
      { id: "fr-reports", name: "Reports", path: "/fundraising/reports", icon: BarChart3, description: "Fundraising and IR reports" },
      { id: "fr-approvals", name: "Approvals", path: "/fundraising/approvals", icon: CiCircleCheck, description: "Commercial and compliance approvals" },
      { id: "fr-audit", name: "Audit Logs", path: "/fundraising/audit", icon: CiViewTimeline, description: "Immutable activity audit trail" },
      { id: "fr-settings", name: "Settings", path: "/fundraising/settings", icon: CiSettings, description: "Pipelines, stages and module config" },
    ],
  },
  {
    id: "fundraising-kyc",
    name: "Fundraising KYC",
    description: "Client Matanho Investor KYC Onboarding design — faithful Next.js port for comparison",
    icon: UserCheck,
    color: "oklch(0.48 0.12 170)",
    path: "/fundraising-kyc",
    subModules: [
      { id: "frk-applicant", name: "Applicant profile", path: "/fundraising-kyc", icon: UserCheck, description: "Relationship and product" },
      { id: "frk-identity", name: "Identity", path: "/fundraising-kyc/identity", icon: Contact, description: "Zimbabwe KYC details" },
      { id: "frk-liveness", name: "Selfie & liveness", path: "/fundraising-kyc/liveness", icon: CiUser, description: "Authorised person check" },
      { id: "frk-ownership", name: "Ownership", path: "/fundraising-kyc/ownership", icon: Users, description: "UBOs and controllers" },
      { id: "frk-investment", name: "Investment & funds", path: "/fundraising-kyc/investment", icon: CircleDollarSign, description: "Purpose and origin" },
      { id: "frk-compliance", name: "Compliance", path: "/fundraising-kyc/compliance", icon: ScrollText, description: "PEP, sanctions and tax" },
      { id: "frk-documents", name: "Documents", path: "/fundraising-kyc/documents", icon: FileText, description: "Evidence and signature" },
      { id: "frk-review", name: "Review & submit", path: "/fundraising-kyc/review", icon: CiCircleCheck, description: "Final certification" },
    ],
  },
  {
    id: "investee-portal-v8",
    name: "Investee Portal",
    description: "Portfolio company KPI, reporting, governance and requests",
    icon: Building2,
    color: "oklch(0.50 0.14 275)",
    path: "/investee-portal-v8",
    hiddenFromSwitcher: true,
    externalPortalUrl: INVESTEE_PORTAL_EXTERNAL_URL,
    subModules: [
      { id: "ip8-dashboard", name: "Overview", path: "/investee-portal-v8", icon: CiGrid41, description: "Company overview" },
      { id: "ip8-kpis", name: "KPI Centre", path: "/investee-portal-v8/kpis", icon: Target, description: "Investor-agreed metrics" },
      { id: "ip8-reports", name: "Reporting", path: "/investee-portal-v8/reports", icon: FileText, description: "Reporting centre" },
      { id: "ip8-forecasts", name: "Forecasts", path: "/investee-portal-v8/forecasts", icon: LineChart, description: "Actuals & forecast model" },
      { id: "ip8-governance", name: "Governance", path: "/investee-portal-v8/governance", icon: ClipboardCheck, description: "Board and reserved matters" },
      { id: "ip8-requests", name: "Requests", path: "/investee-portal-v8/requests", icon: CircleDollarSign, description: "Capital & procurement" },
      { id: "ip8-data-room", name: "Document Vault", path: "/investee-portal-v8/data-room", icon: FolderLock, description: "Secure documents" },
      { id: "ip8-settings", name: "Settings", path: "/investee-portal-v8/settings", icon: CiSettings, description: "Portal settings" },
    ],
  },

  // application-portal
  {
    id: "application-portal",
    name: "Application Portal",
    path: "/application-portal",
    icon: CiGrid41,
    description: "Manage applications and their lifecycle",
    color: "oklch(0.68 0.12 240)",
    hiddenFromSwitcher: true,
    subModules: [
      {
        id: "application-dashboard",
        name: "Dashboard",
        path: "/application-portal",
        icon: CiViewBoard,
        description: "Overview of all applications",
      },
      {
        id: "application-details",
        name: "Application Details",
        path: "/application-portal/application-details",
        icon: CiFileOn,
        description: "Detailed view of a specific application",
      },
      {
        id: "portfolio-company",
        name: "Portfolio Company",
        path: "/application-portal/portfolio-company",
        icon: CiShop,
        description: "Detailed view of a specific portfolio company",
      },
      {
        id: "term-sheets",
        name: "Term Sheets",
        path: "/application-portal/term-sheets",
        icon: CiReceipt,
        description: "Detailed view of a specific term sheets",
      },
      {
        id: "investment-details",
        name: "Investment Details",
        path: "/application-portal/investments-details",
        icon: CiCoins1,
        description: "Detailed view of a specific investment",
      },
      {
        id: "drawdown",
        name: "Drawdown Requests",
        path: "/application-portal/drawdown",
        icon: CiFileOn,
        description: "Create and manage drawdown requests",
      },
      {
        id: "grn",
        name: "Goods Received Notes",
        path: "/application-portal/grn",
        icon: Package,
        description: "Track goods received from purchase orders",
      },
      {
        id: "valuations",
        name: "Valuations",
        path: "/application-portal/valuations",
        icon: CiTrophy,
        description: "Detailed view of a specific valuation",
      },
 
    ],
  },

  // lp-portal
  {
    id: "lp-portal",
    name: "LP Portal",
    path: "/lp-portal",
    icon: Landmark,
    description: "Limited Partner self-service fund dashboard and document vault",
    color: "oklch(0.60 0.14 220)",
    hiddenFromSwitcher: true,
    externalPortalUrl: LP_PORTAL_EXTERNAL_URL,
    subModules: [
      { id: "lp-dashboard", name: "Dashboard", path: "/lp-portal", icon: BarChart3, description: "Fund overview, NAV/IRR metrics, and FX rates" },
      { id: "lp-ledger", name: "Capital Account", path: "/lp-portal/ledger", icon: DollarSign, description: "Capital calls, distributions, and fees ledger" },
      { id: "lp-vault", name: "Document Vault", path: "/lp-portal/vault", icon: FileText, description: "Tax, audit, and performance report documents" },
      { id: "lp-reports", name: "Performance Reports", path: "/lp-portal/reports", icon: CiFileOn, description: "Historical performance report deliveries" },
      { id: "lp-colleagues", name: "Colleagues", path: "/lp-portal/colleagues", icon: Users, description: "Manage colleague access to your LP account" },
    ],
  },

]

export const getModuleById = (id: string): ModuleConfig | undefined => {
  return MODULE_CONFIG.find(module => module.id === id)
}

export const getSubModuleByPath = (path: string): SubModuleConfig | undefined => {
  for (const module of MODULE_CONFIG) {
    const subModule = module.subModules.find(sub => sub.path === path)
    if (subModule) return subModule
    if (module.groups) {
      for (const group of module.groups) {
        if (group.path && group.path === path) {
          return {
            id: group.id,
            name: group.title,
            path: group.path,
            icon: CiViewList,
            description: group.title
          }
        }
        const item = group.items?.find(sub => sub.path === path)
        if (item) return item
      }
    }
  }
  return undefined
}

function pathMatches(base: string, path: string) {
  const b = base.split("?")[0]
  return path === b || path.startsWith(`${b}/`)
}

export const getModuleByPath = (path: string): ModuleConfig | undefined => {
  return MODULE_CONFIG.find(module =>
    pathMatches(module.path, path) ||
    module.subModules.some(sub => pathMatches(sub.path, path)) ||
    (module.groups ? module.groups.some(g => {
      if (g.path && pathMatches(g.path, path)) return true
      return g.items ? g.items.some(sub => pathMatches(sub.path, path)) : false
    }) : false)
  )
}

/** Modules shown in the App Switcher (excludes superseded old UIs). */
export const getSwitcherModules = (): ModuleConfig[] =>
  MODULE_CONFIG.filter((m) => !m.hiddenFromSwitcher && !SUPERSEDED_MODULE_IDS.has(m.id))
