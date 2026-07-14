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
  CiLock
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
  Briefcase,
  ClipboardList,
  Scale,
  LayoutDashboard,
  LineChart,
  Layers,
  FileSpreadsheet,
  GitBranch,
  ArrowUpDown,
  Workflow
} from "lucide-react"
import { IconType } from "react-icons"
import { IoPeopleOutline, IoReceiptOutline, IoStatsChartOutline } from "react-icons/io5"

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
}

export const MODULE_CONFIG: ModuleConfig[] = [
  {
    id: "homepage",
    name: "Homepage",
    description: "Overview of all modules and quick access",
    icon: CiHome,
    color: "oklch(0.60 0.18 252)",
    path: "/",
    subModules: []
  },
  {
    id: "portfolio-management",
    name: "Portfolio Management",
    description: "Manage investment portfolios and assets",
    icon: CiShop,
    color: "oklch(0.72 0.12 225)",
    path: "/portfolio",
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
    id: "payroll",
    name: "Payroll",
    description: "Payroll management",
    icon: CiDollar,
    color: "oklch(0.54 0.1 280)",
    path: "/payroll",
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

  // investments — Arcus Investment Operations terminal (9-module IA)
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
          { id: "investments-orders-setup",      name: "Setup",         path: "/investments-v2/orders/setup",      icon: CiSettings,     description: "Broker, custodian, and signing key configuration" },
        ],
      },
      // Deferred to a later phase — nav preview only, single "coming soon" placeholder page per group.
      {
        id: "investments-reconciliation",
        title: "Reconciliation",
        icon: Scale,
        path: "/investments-v2/reconciliation",
        items: [
          { id: "investments-reconciliation-cash",      name: "Cash Reconciliation",     path: "/investments-v2/reconciliation", icon: CiGrid41, description: "Cash reconciliation" },
          { id: "investments-reconciliation-holdings",  name: "Holdings Reconciliation", path: "/investments-v2/reconciliation", icon: CiGrid41, description: "Holdings reconciliation" },
          { id: "investments-reconciliation-trades",    name: "Trade Reconciliation",    path: "/investments-v2/reconciliation", icon: CiGrid41, description: "Trade reconciliation" },
          { id: "investments-reconciliation-exceptions",name: "Exceptions",              path: "/investments-v2/reconciliation", icon: CiGrid41, description: "Reconciliation exceptions" },
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
          { id: "investments-reporting-trade",     name: "Trade Reports",     path: "/investments-v2/reporting", icon: CiGrid41, description: "Trade reports" },
        ],
      },
      {
        id: "investments-documentation",
        title: "Documentation",
        icon: FileText,
        path: "/investments-v2/documentation",
        items: [
          { id: "investments-documentation-register", name: "Document Register", path: "/investments-v2/documentation", icon: CiGrid41, description: "Document register" },
          { id: "investments-documentation-upload",   name: "Upload",            path: "/investments-v2/documentation", icon: CiGrid41, description: "Upload documents" },
        ],
      },
      {
        id: "investments-accounting",
        title: "Accounting",
        icon: Calculator,
        path: "/investments-v2/accounting",
        items: [
          { id: "investments-accounting-events",   name: "Events",   path: "/investments-v2/accounting", icon: CiGrid41, description: "Accounting events" },
          { id: "investments-accounting-journals", name: "Journals", path: "/investments-v2/accounting", icon: CiGrid41, description: "GL journals" },
        ],
      },
      {
        id: "investments-setup",
        title: "Setup",
        icon: Settings,
        path: "/investments-v2/setup",
        items: [],
      },
    ],
  },

  // forecasting-v2 — Arcus FP&A Planning, Budgeting, Forecasting and Scenario Modelling
  {
    id: "forecasting",
    name: "Forecasting",
    description: "Planning, budgeting, rolling forecasts and scenario modelling",
    icon: LineChart,
    color: "oklch(0.55 0.18 264)",
    path: "/forecasting-v2/home",
    subModules: [
      { id: "forecasting-home", name: "Home", path: "/forecasting-v2/home", icon: LayoutDashboard, description: "FP&A home dashboard" },
      { id: "forecasting-model-builder", name: "Model Builder", path: "/forecasting-v2/model-builder", icon: Layers, description: "No-code planning model builder" },
      { id: "forecasting-planning-worksheet", name: "Planning Worksheet", path: "/forecasting-v2/planning-worksheet", icon: FileSpreadsheet, description: "Spreadsheet-style planning grid" },
      { id: "forecasting-scenario-comparison", name: "Scenario Comparison", path: "/forecasting-v2/scenario-comparison", icon: GitBranch, description: "Base/Upside/Downside scenario comparison" },
      { id: "forecasting-variance", name: "Variance", path: "/forecasting-v2/variance", icon: ArrowUpDown, description: "Actual vs budget vs forecast variance analysis" },
      { id: "forecasting-workflow", name: "Workflow", path: "/forecasting-v2/workflow", icon: Workflow, description: "Budget workflow and approvals" },
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

  // forecasting
  {
    id: "forecasting",
    name: "Forecasting",
    description: "Multi-dimensional scenario forecasting engine",
    icon: TrendingUp,
    color: "oklch(0.52 0.16 240)",
    path: "/forecasting",
    subModules: [
      { id: "forecasting-dashboard", name: "Dashboard",   path: "/forecasting",          icon: CiGrid41,       description: "Forecasting overview and scenario counts" },
      { id: "scenarios",            name: "Scenarios",   path: "/forecasting/scenarios", icon: CiFileOn,       description: "Manage forecast scenarios" },
      { id: "forecasting-audit",    name: "Audit Trail", path: "/forecasting/audit",     icon: CiViewTimeline, description: "Scenario audit log" },
      { id: "forecasting-settings", name: "Settings",    path: "/forecasting/settings",  icon: CiSettings,     description: "Entity management and GL sync" },
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

export const getModuleByPath = (path: string): ModuleConfig | undefined => {
  return MODULE_CONFIG.find(module =>
    path === module.path ||
    module.subModules.some(sub => path.startsWith(sub.path)) ||
    (module.groups ? module.groups.some(g => {
      if (g.path && path.startsWith(g.path.split("?")[0])) return true
      return g.items ? g.items.some(sub => path.startsWith(sub.path.split("?")[0])) : false
    }) : false)
  )
}
