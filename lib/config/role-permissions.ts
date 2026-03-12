/**
 * Role-Based Permissions Configuration
 * 
 * This file maps role codes to their allowed modules and features.
 * Each role has specific access to modules and sub-features within those modules.
 */

import { PROCUREMENT_ACTIONS } from './procurement-permissions';
import { PERFORMANCE_ACTIONS } from './performance-permissions';

export type RoleCode =
  // Finance Roles
  | 'FIN_MGR' | 'CFO' | 'FIN_OFF' | 'ACCOUNTANT' | 'FIN_ASST' | 'FIN_MEM'
  // Sales Roles
  | 'SALES_MGR' | 'SALES_OFF' | 'SALES_REP' | 'SALES_COORD' | 'SALES_MEM'
  // Operations Roles
  | 'OPS_MGR' | 'OPS_OFF' | 'OPS_COORD' | 'OPS_ANALYST' | 'OPS_MEM'
  // Procurement Roles
  | 'PROC_MGR' | 'PROC_OFF' | 'BUYER' | 'PROC_COORD' | 'PROC_MEM'
  // HR Roles
  | 'HR_MGR' | 'HR_OFF' | 'RECRUITER' | 'HR_COORD' | 'HR_MEM'
  // Marketing Roles
  | 'MKT_MGR' | 'MKT_OFF' | 'CONTENT_CREATOR' | 'SOCIAL_MEDIA_MGR' | 'MKT_MEM'
  // Legal Roles
  | 'LEGAL_MGR' | 'LEGAL_OFF' | 'COMPLIANCE_OFF' | 'LEGAL_ADVISOR' | 'LEGAL_MEM'
  // IT Roles
  | 'IT_MGR' | 'SYSADMIN' | 'DEVELOPER' | 'IT_SUPPORT' | 'IT_MEM'
  // Investment Roles
  | 'CEO' | 'CIO' | 'BOARD_CHAIR' | 'INV_ANALYST' | 'BOARD_MEMBER'
  | 'INV_COMM_MEM' | 'COMPLIANCE_OFF_INV' | 'FUND_MGR' | 'PORTFOLIO_MGR'
  | 'LIMITED_PARTNER' | 'EXT_AUDITOR';

export interface ModulePermission {
  moduleId: string;
  access: 'full' | 'read' | 'write' | 'none';
  subModules?: {
    [key: string]: 'full' | 'read' | 'write' | 'none';
  };
  actions?: string[]; // Specific action permissions for this module
}

export interface RolePermissions {
  roleCode: RoleCode;
  level: number;
  department: string;
  modules: ModulePermission[];
}

/**
 * Payroll Specific Actions
 * These are the granular actions for the payroll module
 */
export const PAYROLL_ACTIONS = {
  // Employee Management
  CREATE_EMPLOYEE: 'create-employee',
  UPDATE_EMPLOYEE: 'update-employee',
  DELETE_EMPLOYEE: 'delete-employee',
  VIEW_EMPLOYEE_DETAILS: 'view-employee-details',
  MANAGE_EMPLOYEE_SALARY: 'manage-employee-salary',

  // Payroll Run Management
  CREATE_PAYROLL_RUN: 'create-payroll-run',
  UPDATE_PAYROLL_RUN: 'update-payroll-run',
  DELETE_PAYROLL_RUN: 'delete-payroll-run',
  PROCESS_PAYROLL_RUN: 'process-payroll-run',
  APPROVE_PAYROLL_RUN: 'approve-payroll-run',
  COMPLETE_PAYROLL_RUN: 'complete-payroll-run',

  // Payslip Management
  VIEW_PAYSLIPS: 'view-payslips',
  GENERATE_PAYSLIP: 'generate-payslip',
  DOWNLOAD_PAYSLIP: 'download-payslip',
  VIEW_ALL_PAYSLIPS: 'view-all-payslips',

  // Tax Rules Management
  CREATE_TAX_RULE: 'create-tax-rule',
  UPDATE_TAX_RULE: 'update-tax-rule',
  DELETE_TAX_RULE: 'delete-tax-rule',

  // Allowance Types Management
  CREATE_ALLOWANCE_TYPE: 'create-allowance-type',
  UPDATE_ALLOWANCE_TYPE: 'update-allowance-type',
  DELETE_ALLOWANCE_TYPE: 'delete-allowance-type',

  // Deduction Types Management
  CREATE_DEDUCTION_TYPE: 'create-deduction-type',
  UPDATE_DEDUCTION_TYPE: 'update-deduction-type',
  DELETE_DEDUCTION_TYPE: 'delete-deduction-type',

  // Bank Template Management
  CREATE_BANK_TEMPLATE: 'create-bank-template',
  UPDATE_BANK_TEMPLATE: 'update-bank-template',
  DELETE_BANK_TEMPLATE: 'delete-bank-template',
  GENERATE_BANK_FILE: 'generate-bank-file',

  // Payment Management
  VIEW_PAYMENTS: 'view-payments',
  APPROVE_PAYMENT: 'approve-payment',
  INITIATE_PAYMENT: 'initiate-payment',
} as const

/**
 * Application Portal Specific Actions
 * These are the granular actions for the application workflow timeline
 */
export const APPLICATION_PORTAL_ACTIONS = {
  // Due Diligence Actions
  INITIATE_DUE_DILIGENCE: 'initiate-due-diligence',
  CREATE_DD_TASK: 'create-dd-task',
  UPDATE_DUE_DILIGENCE: 'update-due-diligence',
  COMPLETE_DUE_DILIGENCE: 'complete-due-diligence',
  APPROVE_DD_ACTIVITY: 'approve-dd-activity',

  // Board Review Actions
  INITIATE_BOARD_REVIEW: 'initiate-board-review',
  UPDATE_BOARD_REVIEW: 'update-board-review',
  COMPLETE_BOARD_REVIEW: 'complete-board-review',
  CAST_VOTE: 'cast-vote',

  // Term Sheet Actions
  CREATE_TERM_SHEET: 'create-term-sheet',
  UPDATE_TERM_SHEET: 'update-term-sheet',
  SIGN_TERM_SHEET: 'sign-term-sheet',
  FINALIZE_TERM_SHEET: 'finalize-term-sheet',

  // Fund Disbursement Actions
  INITIATE_FUND_DISBURSEMENT: 'initiate-fund-disbursement',
  CREATE_DISBURSEMENT: 'create-disbursement',
  APPROVE_DISBURSEMENT: 'approve-disbursement',
  DISBURSE_FUND: 'disburse-fund',
  CREATE_MILESTONE: 'create-milestone',
  UPDATE_CHECKLIST: 'update-checklist',
} as const;

/**
 * Portfolio Management Specific Actions
 */
export const PORTFOLIO_ACTIONS = {
  CREATE_FUND: 'create-fund',
  REVIEW_FINANCIAL_REPORT: 'review-financial-report',
  ACCEPT_REPORT: 'accept-report',
  REJECT_REPORT: 'reject-report',
} as const;

/**
 * Complete Role Permissions Matrix
 * Maps each role to specific module and sub-module access
 */
export const ROLE_PERMISSIONS_MAP: Record<RoleCode, RolePermissions> = {
  // ============ FINANCE ROLES ============
  CFO: {
    roleCode: 'CFO',
    level: 5,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'full',
        subModules: {
          'accounting-dashboard': 'full',
          'general-ledger': 'full',
          'cash-book': 'full',
          'invoices': 'full',
          'payables': 'full',
          'bank-reconciliation': 'full',
          'expenses': 'full',
          'inventory-accounting': 'full',
          'asset-management': 'full',
          'financial-reports': 'full',
          'accounting-settings': 'full',
        }
      },
      {
        moduleId: 'payroll',
        access: 'full',
        actions: Object.values(PAYROLL_ACTIONS),
        subModules: {
          'payroll-dashboard': 'full',
          'payroll-employees': 'full',
          'payroll-runs': 'full',
          'payroll-payslips': 'full',
          'payroll-tax-rules': 'full',
          'payroll-allowance-types': 'full',
          'payroll-deduction-types': 'full',
          'payroll-bank-templates': 'full',
        }
      },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: Object.values(PROCUREMENT_ACTIONS),
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'payments': 'full',
          'approval-configurations': 'full',
          'my-approvals': 'full',
        }
      },
      {
        moduleId: 'portfolio-management',
        access: 'read',
        subModules: {
          'Dashboard': 'read',
          'funds': 'read',
          'companies': 'read',
          'applications-dashboard': 'read',
          'applications-all': 'read',
        }
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.DISBURSE_FUND,
        ]
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.CREATE_KPI,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.UPDATE_KPI,
          PERFORMANCE_ACTIONS.DELETE_KPI,
          PERFORMANCE_ACTIONS.ASSIGN_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_ANY_TASK,
          PERFORMANCE_ACTIONS.DELETE_ANY_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
          PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW,
        ],
        subModules: {
          'dashboard': 'full',
          'kpiManagement': 'full',
          'goalsManagement': 'full',
          'taskManagement': 'full',
          'departmentScorecard': 'full',
          'userScorecard': 'full',
        }
      },
      {
        moduleId: 'events-management',
        access: 'read',
      },
      {
        moduleId: 'admin-management',
        access: 'read',
      },
    ]
  },

  FIN_MGR: {
    roleCode: 'FIN_MGR',
    level: 5,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'full',
        subModules: {
          'accounting-dashboard': 'full',
          'general-ledger': 'full',
          'cash-book': 'full',
          'invoices': 'full',
          'payables': 'full',
          'bank-reconciliation': 'full',
          'expenses': 'full',
          'inventory-accounting': 'full',
          'asset-management': 'full',
          'financial-reports': 'full',
          'accounting-settings': 'write',
        }
      },
      {
        moduleId: 'payroll',
        access: 'full',
        actions: Object.values(PAYROLL_ACTIONS),
      },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
          PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
          PROCUREMENT_ACTIONS.VIEW_RFQ,
          PROCUREMENT_ACTIONS.VIEW_QUOTATION,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.CREATE_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.UPDATE_INVOICE,
          PROCUREMENT_ACTIONS.APPROVE_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
          PROCUREMENT_ACTIONS.CREATE_PAYMENT,
          PROCUREMENT_ACTIONS.APPROVE_PAYMENT,
          PROCUREMENT_ACTIONS.PROCESS_PAYMENT,
          PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
          PROCUREMENT_ACTIONS.APPROVE_REQUEST,
          PROCUREMENT_ACTIONS.REJECT_REQUEST,
        ],
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'read',
          'rfq': 'read',
          'quotations': 'read',
          'purchase-orders': 'read',
          'procurement-invoices': 'full',
          'goods-received-notes': 'read',
          'payments': 'full',
          'approval-configurations': 'none',
          'my-approvals': 'full',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_KPIS,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_OWN_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_OWN_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.CREATE_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_TASK,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
        ],
        subModules: {
          'dashboard': 'read',
          'kpi-management': 'write',
          'goals-management': 'write',
          'task-management': 'write',
          'department-scorecard': 'read',
          'user-scorecard': 'full',
        }
      },
    ]
  },

  FIN_OFF: {
    roleCode: 'FIN_OFF',
    level: 4,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'write',
        subModules: {
          'accounting-dashboard': 'read',
          'general-ledger': 'write',
          'cash-book': 'write',
          'invoices': 'write',
          'payables': 'write',
          'bank-reconciliation': 'write',
          'expenses': 'write',
          'inventory-accounting': 'write',
          'asset-management': 'write',
          'financial-reports': 'read',
          'accounting-settings': 'read',
        }
      },
      {
        moduleId: 'payroll',
        access: 'write',
        actions: [
          PAYROLL_ACTIONS.VIEW_EMPLOYEE_DETAILS,
          PAYROLL_ACTIONS.CREATE_EMPLOYEE,
          PAYROLL_ACTIONS.UPDATE_EMPLOYEE,
          PAYROLL_ACTIONS.MANAGE_EMPLOYEE_SALARY,
          PAYROLL_ACTIONS.CREATE_PAYROLL_RUN,
          PAYROLL_ACTIONS.UPDATE_PAYROLL_RUN,
          PAYROLL_ACTIONS.PROCESS_PAYROLL_RUN,
          PAYROLL_ACTIONS.VIEW_PAYSLIPS,
          PAYROLL_ACTIONS.VIEW_ALL_PAYSLIPS,
          PAYROLL_ACTIONS.GENERATE_PAYSLIP,
          PAYROLL_ACTIONS.DOWNLOAD_PAYSLIP,
          PAYROLL_ACTIONS.VIEW_PAYMENTS,
        ],
        subModules: {
          'payroll-dashboard': 'read',
          'payroll-employees': 'write',
          'payroll-runs': 'write',
          'payroll-payslips': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.CREATE_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.DELETE_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
        ],
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'write',
          'purchase-orders': 'write',
          'procurement-invoices': 'write',
          'goods-received-notes': 'read',
          'payments': 'read',
        }
      },
    ]
  },

  ACCOUNTANT: {
    roleCode: 'ACCOUNTANT',
    level: 3,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'write',
        subModules: {
          'accounting-dashboard': 'read',
          'general-ledger': 'write',
          'cash-book': 'write',
          'invoices': 'write',
          'payables': 'write',
          'bank-reconciliation': 'read',
          'expenses': 'write',
          'inventory-accounting': 'write',
          'asset-management': 'write',
          'financial-reports': 'read',
          'accounting-settings': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  FIN_ASST: {
    roleCode: 'FIN_ASST',
    level: 2,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'write',
        subModules: {
          'accounting-dashboard': 'read',
          'general-ledger': 'write',
          'cash-book': 'write',
          'invoices': 'write',
          'payables': 'write',
          'expenses': 'write',
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  FIN_MEM: {
    roleCode: 'FIN_MEM',
    level: 1,
    department: 'Finance',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'accounting-dashboard': 'read',
          'general-ledger': 'read',
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ SALES ROLES ============
  SALES_MGR: {
    roleCode: 'SALES_MGR',
    level: 5,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'invoices': 'full',
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'full',
      },
    ]
  },

  SALES_OFF: {
    roleCode: 'SALES_OFF',
    level: 4,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'invoices': 'write',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'write',
      },
    ]
  },

  SALES_REP: {
    roleCode: 'SALES_REP',
    level: 3,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'invoices': 'write',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'read',
      },
    ]
  },

  SALES_COORD: {
    roleCode: 'SALES_COORD',
    level: 2,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'invoices': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  SALES_MEM: {
    roleCode: 'SALES_MEM',
    level: 1,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ OPERATIONS ROLES ============
  OPS_MGR: {
    roleCode: 'OPS_MGR',
    level: 5,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'procurement', access: 'full' },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_KPIS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_OWN_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.CREATE_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
        ],
        subModules: {
          'kpi-management': 'read',
          'goals-management': 'write',
          'task-management': 'write',
          'department-scorecard': 'read',
          'user-scorecard': 'full',
        }
      },
      { moduleId: 'events-management', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'expenses': 'write',
          'financial-reports': 'read',
        }
      },
    ]
  },

  OPS_OFF: {
    roleCode: 'OPS_OFF',
    level: 4,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'procurement', access: 'write' },
      { moduleId: 'performance-management', access: 'write' },
      { moduleId: 'events-management', access: 'write' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'expenses': 'write',
        }
      },
    ]
  },

  OPS_COORD: {
    roleCode: 'OPS_COORD',
    level: 3,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'procurement', access: 'write' },
      { moduleId: 'events-management', access: 'write' },
    ]
  },

  OPS_ANALYST: {
    roleCode: 'OPS_ANALYST',
    level: 2,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      { moduleId: 'performance-management', access: 'full' },
    ]
  },

  OPS_MEM: {
    roleCode: 'OPS_MEM',
    level: 1,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ PROCUREMENT ROLES ============
  PROC_MGR: {
    roleCode: 'PROC_MGR',
    level: 5,
    department: 'Procurement',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.DELETE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.APPROVE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.REJECT_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.CREATE_RFQ,
          PROCUREMENT_ACTIONS.VIEW_RFQ,
          PROCUREMENT_ACTIONS.UPDATE_RFQ,
          PROCUREMENT_ACTIONS.DELETE_RFQ,
          PROCUREMENT_ACTIONS.SEND_RFQ,
          PROCUREMENT_ACTIONS.CLOSE_RFQ,
          PROCUREMENT_ACTIONS.VIEW_QUOTATION,
          PROCUREMENT_ACTIONS.REVIEW_QUOTATION,
          PROCUREMENT_ACTIONS.ACCEPT_QUOTATION,
          PROCUREMENT_ACTIONS.REJECT_QUOTATION,
          PROCUREMENT_ACTIONS.COMPARE_QUOTATIONS,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.DELETE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.APPROVE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.SEND_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.CREATE_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.UPDATE_INVOICE,
          PROCUREMENT_ACTIONS.DELETE_INVOICE,
          PROCUREMENT_ACTIONS.APPROVE_INVOICE,
          PROCUREMENT_ACTIONS.CREATE_GRN,
          PROCUREMENT_ACTIONS.VIEW_GRN,
          PROCUREMENT_ACTIONS.UPDATE_GRN,
          PROCUREMENT_ACTIONS.DELETE_GRN,
          PROCUREMENT_ACTIONS.APPROVE_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
          PROCUREMENT_ACTIONS.CREATE_PAYMENT,
          PROCUREMENT_ACTIONS.APPROVE_PAYMENT,
          PROCUREMENT_ACTIONS.PROCESS_PAYMENT,
          PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
          PROCUREMENT_ACTIONS.APPROVE_REQUEST,
          PROCUREMENT_ACTIONS.REJECT_REQUEST,
        ],
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'payments': 'full',
          'approval-configurations': 'none',
          'my-approvals': 'full',
        }
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'expenses': 'write',
          'inventory-accounting': 'read',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'write',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_KPIS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_OWN_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.CREATE_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
        ],
        subModules: {
          'kpi-management': 'read',
          'goals-management': 'write',
          'task-management': 'write',
          'department-scorecard': 'read',
          'user-scorecard': 'full',
        }
      },
    ]
  },

  PROC_OFF: {
    roleCode: 'PROC_OFF',
    level: 4,
    department: 'Procurement',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.DELETE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.CREATE_RFQ,
          PROCUREMENT_ACTIONS.VIEW_RFQ,
          PROCUREMENT_ACTIONS.UPDATE_RFQ,
          PROCUREMENT_ACTIONS.DELETE_RFQ,
          PROCUREMENT_ACTIONS.SEND_RFQ,
          PROCUREMENT_ACTIONS.CLOSE_RFQ,
          PROCUREMENT_ACTIONS.VIEW_QUOTATION,
          PROCUREMENT_ACTIONS.REVIEW_QUOTATION,
          PROCUREMENT_ACTIONS.ACCEPT_QUOTATION,
          PROCUREMENT_ACTIONS.REJECT_QUOTATION,
          PROCUREMENT_ACTIONS.COMPARE_QUOTATIONS,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.DELETE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.SEND_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.CREATE_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.UPDATE_INVOICE,
          PROCUREMENT_ACTIONS.DELETE_INVOICE,
          PROCUREMENT_ACTIONS.CREATE_GRN,
          PROCUREMENT_ACTIONS.VIEW_GRN,
          PROCUREMENT_ACTIONS.UPDATE_GRN,
          PROCUREMENT_ACTIONS.DELETE_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
          PROCUREMENT_ACTIONS.CREATE_PAYMENT,
          PROCUREMENT_ACTIONS.PROCESS_PAYMENT,
          PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
          PROCUREMENT_ACTIONS.APPROVE_REQUEST,
          PROCUREMENT_ACTIONS.REJECT_REQUEST,
        ],
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'payments': 'full',
          'approval-configurations': 'none',
          'my-approvals': 'full',
        }
      },
    ]
  },

  BUYER: {
    roleCode: 'BUYER',
    level: 3,
    department: 'Procurement',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.CREATE_RFQ,
          PROCUREMENT_ACTIONS.VIEW_RFQ,
          PROCUREMENT_ACTIONS.UPDATE_RFQ,
          PROCUREMENT_ACTIONS.SEND_RFQ,
          PROCUREMENT_ACTIONS.VIEW_QUOTATION,
          PROCUREMENT_ACTIONS.REVIEW_QUOTATION,
          PROCUREMENT_ACTIONS.COMPARE_QUOTATIONS,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.UPDATE_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
          PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
        ],
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'write',
          'procurement-invoices': 'write',
          'goods-received-notes': 'write',
          'payments': 'read',
          'approval-configurations': 'none',
          'my-approvals': 'read',
        }
      },
    ]
  },

  PROC_COORD: {
    roleCode: 'PROC_COORD',
    level: 2,
    department: 'Procurement',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        subModules: {
          'purchase-requisitions': 'write',
          'goods-received-notes': 'write',
        }
      },
    ]
  },

  PROC_MEM: {
    roleCode: 'PROC_MEM',
    level: 1,
    department: 'Procurement',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'read',
      },
    ]
  },

  // ============ HR ROLES ============
  HR_MGR: {
    roleCode: 'HR_MGR',
    level: 5,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'payroll',
        access: 'full',
        actions: Object.values(PAYROLL_ACTIONS),
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.CREATE_KPI,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.UPDATE_KPI,
          PERFORMANCE_ACTIONS.DELETE_KPI,
          PERFORMANCE_ACTIONS.ASSIGN_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_ANY_TASK,
          PERFORMANCE_ACTIONS.DELETE_ANY_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.UPDATE_SCORECARD,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
          PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW,
        ],
        subModules: {
          'dashboard': 'full',
          'kpiManagement': 'full',
          'goalsManagement': 'full',
          'taskManagement': 'full',
          'departmentScorecard': 'full',
          'userScorecard': 'full',
        }
      },
      {
        moduleId: 'admin-management',
        access: 'write',
        subModules: {
          'user-management': 'write',
          'role-management': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  HR_OFF: {
    roleCode: 'HR_OFF',
    level: 4,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'payroll',
        access: 'write',
        actions: [
          PAYROLL_ACTIONS.CREATE_EMPLOYEE,
          PAYROLL_ACTIONS.UPDATE_EMPLOYEE,
          PAYROLL_ACTIONS.DELETE_EMPLOYEE,
          PAYROLL_ACTIONS.VIEW_EMPLOYEE_DETAILS,
          PAYROLL_ACTIONS.MANAGE_EMPLOYEE_SALARY,
          PAYROLL_ACTIONS.CREATE_PAYROLL_RUN,
          PAYROLL_ACTIONS.UPDATE_PAYROLL_RUN,
          PAYROLL_ACTIONS.VIEW_PAYSLIPS,
          PAYROLL_ACTIONS.VIEW_ALL_PAYSLIPS,
          PAYROLL_ACTIONS.GENERATE_PAYSLIP,
          PAYROLL_ACTIONS.DOWNLOAD_PAYSLIP,
          PAYROLL_ACTIONS.CREATE_ALLOWANCE_TYPE,
          PAYROLL_ACTIONS.UPDATE_ALLOWANCE_TYPE,
          PAYROLL_ACTIONS.DELETE_ALLOWANCE_TYPE,
          PAYROLL_ACTIONS.CREATE_DEDUCTION_TYPE,
          PAYROLL_ACTIONS.UPDATE_DEDUCTION_TYPE,
          PAYROLL_ACTIONS.DELETE_DEDUCTION_TYPE,
        ],
      },
      {
        moduleId: 'performance-management',
        access: 'write',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.CREATE_INDIVIDUAL_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_INDIVIDUAL_GOAL,
          PERFORMANCE_ACTIONS.CREATE_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_OWN_TASK,
          PERFORMANCE_ACTIONS.VIEW_OWN_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
        ],
        subModules: {
          'dashboard': 'read',
          'kpiManagement': 'write',
          'goalsManagement': 'write',
          'taskManagement': 'write',
          'departmentScorecard': 'read',
          'userScorecard': 'full',
        }
      },
      {
        moduleId: 'admin-management',
        access: 'read',
        subModules: {
          'user-management': 'write',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  RECRUITER: {
    roleCode: 'RECRUITER',
    level: 3,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'admin-management',
        access: 'read',
        subModules: {
          'user-management': 'write',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  HR_COORD: {
    roleCode: 'HR_COORD',
    level: 2,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'payroll',
        access: 'read',
        actions: [
          PAYROLL_ACTIONS.VIEW_EMPLOYEE_DETAILS,
          PAYROLL_ACTIONS.VIEW_PAYSLIPS,
          PAYROLL_ACTIONS.VIEW_ALL_PAYSLIPS,
        ],
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  HR_MEM: {
    roleCode: 'HR_MEM',
    level: 1,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ MARKETING ROLES ============
  MKT_MGR: {
    roleCode: 'MKT_MGR',
    level: 5,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'events-management',
        access: 'full',
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'expenses': 'write',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  MKT_OFF: {
    roleCode: 'MKT_OFF',
    level: 4,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'events-management',
        access: 'write',
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  CONTENT_CREATOR: {
    roleCode: 'CONTENT_CREATOR',
    level: 3,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'events-management',
        access: 'write',
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  SOCIAL_MEDIA_MGR: {
    roleCode: 'SOCIAL_MEDIA_MGR',
    level: 2,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'events-management',
        access: 'write',
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  MKT_MEM: {
    roleCode: 'MKT_MEM',
    level: 1,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ LEGAL ROLES ============
  LEGAL_MGR: {
    roleCode: 'LEGAL_MGR',
    level: 5,
    department: 'Legal',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'read',
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.SIGN_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  LEGAL_OFF: {
    roleCode: 'LEGAL_OFF',
    level: 4,
    department: 'Legal',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'read',
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.SIGN_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  COMPLIANCE_OFF: {
    roleCode: 'COMPLIANCE_OFF',
    level: 3,
    department: 'Legal',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'read',
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.SIGN_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  LEGAL_ADVISOR: {
    roleCode: 'LEGAL_ADVISOR',
    level: 2,
    department: 'Legal',
    modules: [
      {
        moduleId: 'homepage',
        access: 'full'
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.SIGN_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  LEGAL_MEM: {
    roleCode: 'LEGAL_MEM',
    level: 1,
    department: 'Legal',
    modules: [
      {
        moduleId: 'homepage',
        access: 'full'
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.SIGN_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ IT ROLES ============
  IT_MGR: {
    roleCode: 'IT_MGR',
    level: 5,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'full',
        actions: Object.values(APPLICATION_PORTAL_ACTIONS)
      },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: Object.values(PROCUREMENT_ACTIONS),
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'payments': 'full',
          'approval-configurations': 'full',
        }
      },
      {
        moduleId: 'admin-management',
        access: 'full',
      },
    ]
  },

  SYSADMIN: {
    roleCode: 'SYSADMIN',
    level: 4,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'full',
        actions: Object.values(APPLICATION_PORTAL_ACTIONS)
      },
      {
        moduleId: 'accounting',
        access: 'full',
        subModules: {
          'accounting-dashboard': 'full',
          'general-ledger': 'full',
          'cash-book': 'full',
          'invoices': 'full',
          'payables': 'full',
          'bank-reconciliation': 'full',
          'expenses': 'full',
          'inventory-accounting': 'full',
          'asset-management': 'full',
          'financial-reports': 'full',
          'accounting-settings': 'full',
        }
      },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: Object.values(PROCUREMENT_ACTIONS),
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'rfq': 'full',
          'quotations': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'payments': 'full',
          'approval-configurations': 'full',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.CREATE_KPI,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.UPDATE_KPI,
          PERFORMANCE_ACTIONS.DELETE_KPI,
          PERFORMANCE_ACTIONS.ASSIGN_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_ANY_TASK,
          PERFORMANCE_ACTIONS.DELETE_ANY_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
          PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW,
        ],
        subModules: {
          'performance-dashboard': 'full',
          'departments': 'full',
          'kpi-management': 'full',
          'goals-management': 'full',
          'task-management': 'full',
          'department-scorecard': 'full',
          'user-scorecard': 'full',
        }
      },
      {
        moduleId: 'admin-management',
        access: 'full',
      },
    ]
  },

  DEVELOPER: {
    roleCode: 'DEVELOPER',
    level: 3,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      // {
      //   moduleId: 'admin-management',
      //   access: 'read',
      //   subModules: {
      //     'admin-dashboard': 'read',
      //     'user-management': 'read',
      //     'role-management': 'read',
      //   }
      // },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  IT_SUPPORT: {
    roleCode: 'IT_SUPPORT',
    level: 2,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'admin-management',
        access: 'read',
        subModules: {
          'user-management': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  IT_MEM: {
    roleCode: 'IT_MEM',
    level: 1,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  // ============ INVESTMENT ROLES ============
  CEO: {
    roleCode: 'CEO',
    level: 5,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'full',
        actions: Object.values(APPLICATION_PORTAL_ACTIONS)
      },
      {
        moduleId: 'accounting',
        access: 'full',
        subModules: {
          'accounting-dashboard': 'full',
          'general-ledger': 'full',
          'cash-book': 'full',
          'invoices': 'full',
          'payables': 'full',
          'bank-reconciliation': 'full',
          'expenses': 'full',
          'inventory-accounting': 'full',
          'asset-management': 'full',
          'financial-reports': 'full',
          'accounting-settings': 'full',
        }
      },
      { moduleId: 'payroll', access: 'read' },
      {
        moduleId: 'procurement',
        access: 'full',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
          PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
          PROCUREMENT_ACTIONS.VIEW_RFQ,
          PROCUREMENT_ACTIONS.VIEW_QUOTATION,
          PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER,
          PROCUREMENT_ACTIONS.VIEW_INVOICE,
          PROCUREMENT_ACTIONS.VIEW_GRN,
          PROCUREMENT_ACTIONS.VIEW_PAYMENT,
          PROCUREMENT_ACTIONS.CREATE_APPROVAL_CONFIG,
          PROCUREMENT_ACTIONS.VIEW_APPROVAL_CONFIG,
          PROCUREMENT_ACTIONS.UPDATE_APPROVAL_CONFIG,
          PROCUREMENT_ACTIONS.DELETE_APPROVAL_CONFIG,
          PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
          PROCUREMENT_ACTIONS.APPROVE_REQUEST,
          PROCUREMENT_ACTIONS.REJECT_REQUEST,
        ],
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'read',
          'rfq': 'read',
          'quotations': 'read',
          'purchase-orders': 'read',
          'procurement-invoices': 'read',
          'goods-received-notes': 'read',
          'payments': 'read',
          'approval-configurations': 'full',
          'my-approvals': 'full',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.CREATE_KPI,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.UPDATE_KPI,
          PERFORMANCE_ACTIONS.DELETE_KPI,
          PERFORMANCE_ACTIONS.ASSIGN_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_ANY_TASK,
          PERFORMANCE_ACTIONS.DELETE_ANY_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
          PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW,
        ],
        subModules: {
          'dashboard': 'full',
          'kpiManagement': 'full',
          'goalsManagement': 'full',
          'taskManagement': 'full',
          'departmentScorecard': 'read',
          'userScorecard': 'full',
        }
      },
      { moduleId: 'events-management', access: 'read' },
      { moduleId: 'admin-management', access: 'full' },
    ]
  },

  CIO: {
    roleCode: 'CIO',
    level: 5,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'full',
        actions: Object.values(APPLICATION_PORTAL_ACTIONS)
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'read',
        actions: [
          PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
          PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
        ],
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'none',
          'rfq': 'none',
          'quotations': 'none',
          'purchase-orders': 'none',
          'procurement-invoices': 'none',
          'goods-received-notes': 'none',
          'payments': 'none',
          'approval-configurations': 'none',
          'my-approvals': 'read',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'full',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE,
          PERFORMANCE_ACTIONS.CREATE_KPI,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.UPDATE_KPI,
          PERFORMANCE_ACTIONS.DELETE_KPI,
          PERFORMANCE_ACTIONS.ASSIGN_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS,
          PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL,
          PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.UPDATE_ANY_TASK,
          PERFORMANCE_ACTIONS.DELETE_ANY_TASK,
          PERFORMANCE_ACTIONS.ASSIGN_TASK,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW,
          PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS,
          PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW,
        ],
        subModules: {
          'dashboard': 'full',
          'kpi-management': 'full',
          'goals-management': 'full',
          'task-management': 'full',
          'department-scorecard': 'full',
          'user-scorecard': 'full',
        }
      },
      { moduleId: 'admin-management', access: 'read' },
    ]
  },

  BOARD_CHAIR: {
    roleCode: 'BOARD_CHAIR',
    level: 5,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'full',
        actions: Object.values(APPLICATION_PORTAL_ACTIONS)
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'financial-reports': 'read',
        }
      },
    ]
  },

  BOARD_MEMBER: {
    roleCode: 'BOARD_MEMBER',
    level: 4,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'portfolio-management', access: 'read' },
      {
        moduleId: 'application-portal',
        access: 'read',
        actions: [
          APPLICATION_PORTAL_ACTIONS.CAST_VOTE,
          APPLICATION_PORTAL_ACTIONS.UPDATE_BOARD_REVIEW,
          APPLICATION_PORTAL_ACTIONS.COMPLETE_BOARD_REVIEW,
        ]
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'financial-reports': 'read',
        }
      },
    ]
  },

  INV_COMM_MEM: {
    roleCode: 'INV_COMM_MEM',
    level: 4,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'portfolio-management', access: 'write' },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.CAST_VOTE,
          APPLICATION_PORTAL_ACTIONS.UPDATE_BOARD_REVIEW,
          APPLICATION_PORTAL_ACTIONS.COMPLETE_BOARD_REVIEW,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY,
        ]
      },
    ]
  },

  FUND_MGR: {
    roleCode: 'FUND_MGR',
    level: 5,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.UPDATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.CREATE_DD_TASK,
          APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.INITIATE_FUND_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.CREATE_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.DISBURSE_FUND,
          APPLICATION_PORTAL_ACTIONS.CREATE_MILESTONE,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'read',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_OWN_SCORECARD,
        ],
        subModules: {
          'department-scorecard': 'read',
          'user-scorecard': 'read',
        }
      },
    ]
  },

  PORTFOLIO_MGR: {
    roleCode: 'PORTFOLIO_MGR',
    level: 5,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'full',
        actions: Object.values(PORTFOLIO_ACTIONS)
      },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.INITIATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.CREATE_DD_TASK,
          APPLICATION_PORTAL_ACTIONS.UPDATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY,
          APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.INITIATE_FUND_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.CREATE_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.DISBURSE_FUND,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
        ]
      },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'read',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_KPIS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_OWN_SCORECARD,
        ],
        subModules: {
          'kpi-management': 'read',
          'goals-management': 'read',
          'department-scorecard': 'read',
          'user-scorecard': 'read',
        }
      },
    ]
  },

  INV_ANALYST: {
    roleCode: 'INV_ANALYST',
    level: 3,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'portfolio-management', access: 'write' },
      { moduleId: 'performance-management', access: 'full' },
      {
        moduleId: 'application-portal',
        access: 'write',
        actions: [
          APPLICATION_PORTAL_ACTIONS.COMPLETE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
        ]
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  COMPLIANCE_OFF_INV: {
    roleCode: 'COMPLIANCE_OFF_INV',
    level: 4,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      { moduleId: 'portfolio-management', access: 'read' },
      { moduleId: 'application-portal', access: 'read' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'accounting-dashboard': 'read',
          'cash-book': 'read',
          'invoices': 'read',
          'payables': 'read',
          'bank-reconciliation': 'read',
          'expenses': 'read',
          'inventory-accounting': 'read',
          'asset-management': 'read',
          'accounting-settings': 'read',
        }
      },
      {
        moduleId: 'performance-management',
        access: 'read',
        actions: [
          PERFORMANCE_ACTIONS.VIEW_DASHBOARD,
          PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE,
          PERFORMANCE_ACTIONS.VIEW_KPI,
          PERFORMANCE_ACTIONS.VIEW_ALL_KPIS,
          PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS,
          PERFORMANCE_ACTIONS.VIEW_ALL_TASKS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS,
          PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS,
          PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD,
          PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS,
        ],
        subModules: {
          'performance-dashboard': 'read',
          'departments': 'read',
          'kpi-management': 'read',
          'goals-management': 'read',
          'task-management': 'read',
          'department-scorecard': 'read',
          'user-scorecard': 'read',
        }
      },
      {
        moduleId: 'procurement',
        access: 'write',
        actions: [
          PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
          PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
        ],
        subModules: {
          'purchase-requisitions': 'write',
        }
      },
    ]
  },

  LIMITED_PARTNER: { 
    roleCode: 'LIMITED_PARTNER',
    level: 2,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'portfolio-management',
        access: 'read',
        subModules: {
          'Dashboard': 'read',
          'funds': 'read',
          'applications-dashboard': 'read',
          'applications-all': 'read',
        }
      },
    ]
  },

  EXT_AUDITOR: {
    roleCode: 'EXT_AUDITOR',
    level: 3,
    department: 'Investments',
    modules: [
      { moduleId: 'homepage', access: 'full' },
      {
        moduleId: 'accounting',
        access: 'read',
        subModules: {
          'accounting-dashboard': 'read',
          'general-ledger': 'read',
          'cash-book': 'read',
          'invoices': 'read',
          'bank-reconciliation': 'read',
          'expenses': 'read',
          'inventory-accounting': 'read',
          'asset-management': 'read',
          'financial-reports': 'read',
        }
      },
      {
        moduleId: 'portfolio-management',
        access: 'read',
      },
    ]
  },
};

/**
 * Get role permissions by role code
 */
export function getRolePermissions(roleCode: RoleCode): RolePermissions | null {
  return ROLE_PERMISSIONS_MAP[roleCode] || null;
}

/**
 * Check if a role has access to a specific module
 */
export function hasModuleAccess(
  roleCode: RoleCode,
  moduleId: string
): boolean {
  const permissions = getRolePermissions(roleCode);
  if (!permissions) return false;

  const modulePermission = permissions.modules.find(m => m.moduleId === moduleId);
  return modulePermission ? modulePermission.access !== 'none' : false;
}

/**
 * Get access level for a specific module
 */
export function getModuleAccessLevel(
  roleCode: RoleCode,
  moduleId: string
): 'full' | 'read' | 'write' | 'none' {
  const permissions = getRolePermissions(roleCode);
  if (!permissions) return 'none';

  const modulePermission = permissions.modules.find(m => m.moduleId === moduleId);
  return modulePermission?.access || 'none';
}

/**
 * Check if a role has access to a specific sub-module
 */
export function hasSubModuleAccess(
  roleCode: RoleCode,
  moduleId: string,
  subModuleId: string
): boolean {
  const permissions = getRolePermissions(roleCode);
  if (!permissions) return false;

  const modulePermission = permissions.modules.find(m => m.moduleId === moduleId);
  if (!modulePermission || modulePermission.access === 'none') return false;

  // If no specific sub-module permissions, inherit from module
  if (!modulePermission.subModules) {
    return true; // Already checked access !== 'none' above
  }

  const subModuleAccess = modulePermission.subModules[subModuleId];
  return subModuleAccess ? subModuleAccess !== 'none' : false;
}

/**
 * Get all accessible modules for a role
 */
export function getAccessibleModules(roleCode: RoleCode): string[] {
  const permissions = getRolePermissions(roleCode);
  if (!permissions) return [];

  return permissions.modules
    .filter(m => m.access !== 'none')
    .map(m => m.moduleId);
}

/**
 * Check if user can perform action based on access level
 */
export function canPerformAction(
  accessLevel: 'full' | 'read' | 'write' | 'none',
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  if (accessLevel === 'none') return false;
  if (accessLevel === 'full') return true;

  if (accessLevel === 'read') {
    return action === 'read';
  }

  if (accessLevel === 'write') {
    return action === 'create' || action === 'read' || action === 'update';
  }

  return false;
}
