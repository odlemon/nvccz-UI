/**
 * Role-Based Permissions Configuration
 * 
 * This file maps role codes to their allowed modules and features.
 * Each role has specific access to modules and sub-features within those modules.
 */

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
        access: 'read',
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'read',
          'purchase-orders': 'read',
          'procurement-invoices': 'full',
          'goods-received-notes': 'read',
          'approval-configurations': 'read',
          'approval-requests': 'full',
        }
      },
      { 
        moduleId: 'portfolio-management', 
        access: 'read',
        subModules: {
          'Dashboard': 'read',
          'funds': 'read',
          'companies': 'read',
        }
      },
      { 
        moduleId: 'performance-management', 
        access: 'read',
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
        access: 'read',
        subModules: {
          'procurement-invoices': 'full',
          'approval-requests': 'full',
        }
      },
      { 
        moduleId: 'performance-management', 
        access: 'read',
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
          'bank-reconciliation': 'read',
          'expenses': 'write',
          'inventory-accounting': 'write',
          'asset-management': 'write',
          'financial-reports': 'read',
          'accounting-settings': 'read',
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
          'expenses': 'write',
          'financial-reports': 'read',
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
    ]
  },

  SALES_MEM: {
    roleCode: 'SALES_MEM',
    level: 1,
    department: 'Sales',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
      { moduleId: 'performance-management', access: 'full' },
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
      { moduleId: 'performance-management', access: 'full' },
    ]
  },

  OPS_MEM: {
    roleCode: 'OPS_MEM',
    level: 1,
    department: 'Operations',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
        subModules: {
          'procurement-dashboard': 'full',
          'purchase-requisitions': 'full',
          'purchase-orders': 'full',
          'procurement-invoices': 'full',
          'goods-received-notes': 'full',
          'approval-configurations': 'full',
          'approval-requests': 'full',
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
        access: 'write',
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'write',
          'purchase-orders': 'write',
          'procurement-invoices': 'write',
          'goods-received-notes': 'write',
          'approval-requests': 'write',
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
        subModules: {
          'procurement-dashboard': 'read',
          'purchase-requisitions': 'write',
          'purchase-orders': 'write',
          'goods-received-notes': 'write',
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
      },
      { 
        moduleId: 'admin-management', 
        access: 'write',
        subModules: {
          'user-management': 'write',
          'role-management': 'read',
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
      },
      { 
        moduleId: 'admin-management', 
        access: 'read',
        subModules: {
          'user-management': 'write',
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
    ]
  },

  HR_MEM: {
    roleCode: 'HR_MEM',
    level: 1,
    department: 'Human Resources',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
    ]
  },

  MKT_MEM: {
    roleCode: 'MKT_MEM',
    level: 1,
    department: 'Marketing',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
        access: 'read',
      },
      { 
        moduleId: 'procurement', 
        access: 'read',
        subModules: {
          'approval-requests': 'write',
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
        moduleId: 'procurement', 
        access: 'read',
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
        access: 'read',
      },
    ]
  },

  LEGAL_ADVISOR: {
    roleCode: 'LEGAL_ADVISOR',
    level: 2,
    department: 'Legal',
    modules: [
      { moduleId: 'homepage', access: 'full' },
    ]
  },

  LEGAL_MEM: {
    roleCode: 'LEGAL_MEM',
    level: 1,
    department: 'Legal',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
      { 
        moduleId: 'admin-management', 
        access: 'read',
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
    ]
  },

  IT_MEM: {
    roleCode: 'IT_MEM',
    level: 1,
    department: 'IT',
    modules: [
      { moduleId: 'homepage', access: 'full' },
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
      { moduleId: 'accounting', access: 'read' },
      { moduleId: 'payroll', access: 'read' },
      { moduleId: 'procurement', access: 'read' },
      { moduleId: 'performance-management', access: 'full' },
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
      { moduleId: 'performance-management', access: 'read' },
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
          APPLICATION_PORTAL_ACTIONS.INITIATE_FUND_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.CREATE_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DISBURSEMENT,
          APPLICATION_PORTAL_ACTIONS.DISBURSE_FUND,
          APPLICATION_PORTAL_ACTIONS.CREATE_MILESTONE,
          APPLICATION_PORTAL_ACTIONS.UPDATE_CHECKLIST,
          APPLICATION_PORTAL_ACTIONS.CREATE_TERM_SHEET,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
          // APPLICATION_PORTAL_ACTIONS.FINALIZE_TERM_SHEET,
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
          APPLICATION_PORTAL_ACTIONS.UPDATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY,
          APPLICATION_PORTAL_ACTIONS.UPDATE_BOARD_REVIEW,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
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
          APPLICATION_PORTAL_ACTIONS.INITIATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.CREATE_DD_TASK,
          APPLICATION_PORTAL_ACTIONS.UPDATE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.COMPLETE_DUE_DILIGENCE,
          APPLICATION_PORTAL_ACTIONS.APPROVE_DD_ACTIVITY,
          APPLICATION_PORTAL_ACTIONS.UPDATE_BOARD_REVIEW,
          APPLICATION_PORTAL_ACTIONS.UPDATE_TERM_SHEET,
        ]
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
          'financial-reports': 'read',
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
          'general-ledger': 'read',
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
