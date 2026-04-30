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
  FileText
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
      { id: "companies", name: "Companies", path: "/portfolio/companies", icon: CiShop, description: "Manage companies" }

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
      { id: "performance-dashboard", name: "Performance Dashboard", path: "/performance", icon: CiGrid41, description: "Overview and metrics" },
      { id: "org-bsc", name: "Org BSC", path: "/performance/org-bsc", icon: CiGrid41, description: "Organisational BSC dashboard" },
      { id: "performance-reviews", name: "Reviews", path: "/performance/reviews", icon: CiFileOn, description: "Unified hub for self-assessments, evaluations, cycles and reports" }
    ],
    groups: [
      {
        id: "data-entry",
        title: "Data Entry & Planning",
        icon: CiViewList,
        items: [
          { id: "bsc-operations", name: "BSC Operations", path: "/performance/bsc-operations", icon: CiCoins1, description: "BSC data entry, workflow submissions and contract creation hub" },
          { id: "goals-management", name: "Goals Management", path: "/performance/goals", icon: CiCircleCheck, description: "Goals" },
          { id: "tasks-management", name: "Tasks Management", path: "/performance/tasks", icon: CiViewList, description: "Tasks" },
          { id: "kpi-management", name: "KPI Management", path: "/performance/kpis", icon: CiViewTimeline, description: "KPIs" }
        ]
      },
      {
        id: "contracts",
        title: "Performance Contracts",
        icon: CiMedal,
        items: [
          { id: "performance-contracts", name: "Contract Management", path: "/performance/contracts", icon: CiMedal, description: "CEO, Board, Department and Employee BSC contracts" },
        ]
      },
      {
        id: "scorecards",
        title: "Scorecard Generation",
        icon: CiViewBoard,
        items: [
          { id: "board-scorecards", name: "Board Scorecards", path: "/performance/board-scorecards", icon: IoStatsChartOutline, description: "Board contract scorecards" },
          { id: "ceo-scorecards", name: "CEO Scorecards", path: "/performance/ceo-scorecards", icon: CiTrophy, description: "CEO contract scorecards" },
          { id: "department-scorecards", name: "Department Scorecards", path: "/performance/department-scorecards", icon: CiViewBoard, description: "Department performance scorecards" },
          { id: "user-scorecards", name: "Employee Scorecards", path: "/performance/user-scorecards", icon: CiViewTable, description: "User performance scorecards" }
        ]
      },
      {
        id: "setup",
        title: "Setup",
        icon: CiSettings,
        items: [
          { id: "departments-management", name: "Departments", path: "/performance/departments", icon: CiUser, description: "Department management" },
          { id: "config-pillars", name: "BSC Pillars", path: "/performance/configuration/pillars", icon: CiViewBoard, description: "BSC pillars and goal weights" },
          { id: "config-strategy", name: "Strategy", path: "/performance/configuration/strategy", icon: CiFileOn, description: "Vision and strategy cycles" },
          { id: "config-themes", name: "Themes", path: "/performance/configuration/themes", icon: CiViewTable, description: "Strategic themes and goal tagging" }
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
      {
        id: "reports",
        name: "Financial Reports",
        path: "/application-portal/reports",
        icon: CiText,
        description: "Detailed view of a specific report",
      },
      {
        id: "application-portal-settings",
        name: "Settings",
        path: "/application-portal/settings",
        icon: CiSettings,
        description: "Company letterhead and portal settings",
      },
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
