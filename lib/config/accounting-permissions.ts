/**
 * Accounting Module Specific Permissions
 * Based on the permissions matrix (permissions-matrix-2026-03-03.json)
 * 
 * Maps every action from the JSON matrix to a named constant,
 * then assigns per-role action arrays so each UI button/tab can be gated precisely.
 */

// ---------------------------------------------------------------------------
// Action Constants
// ---------------------------------------------------------------------------
export const ACCOUNTING_ACTIONS = {
  // Dashboard
  VIEW_DASHBOARD: 'view-accounting-dashboard',

  // General Ledger
  CREATE_JOURNAL_ENTRY: 'create-journal-entry',

  // Cash Book
  VIEW_CASHBOOK: 'view-cashbook',
  PROCESS_CASHBOOK: 'process-cashbook',

  // Accounts Receivable – Invoices
  VIEW_INVOICES: 'view-invoices',
  CREATE_INVOICE: 'create-invoice',
  READ_INVOICE: 'read-invoice',
  UPDATE_INVOICE: 'update-invoice',
  DELETE_INVOICE: 'delete-invoice',
  MARK_INVOICE_PAID: 'mark-invoice-paid',

  // Accounts Receivable – Credit Notes
  VIEW_CREDIT_NOTES: 'view-credit-notes',
  CREATE_CREDIT_NOTE: 'create-credit-note',
  READ_CREDIT_NOTE: 'read-credit-note',
  UPDATE_CREDIT_NOTE: 'update-credit-note',
  DELETE_CREDIT_NOTE: 'delete-credit-note',

  // Accounts Payable
  CREATE_PURCHASE_ORDER: 'create-purchase-order',
  VIEW_PURCHASE_ORDER: 'view-purchase-order',
  CREATE_PAYABLE: 'create-payable',
  VIEW_PAYABLE: 'view-payable',
  UPDATE_PAYABLE: 'update-payable',
  DELETE_PAYABLE: 'delete-payable',
  MARK_PAYABLE_PAID: 'mark-payable-paid',

  // Bank Reconciliation
  VIEW_BANK_RECONCILIATION: 'view-bank-reconciliation',
  UPLOAD_BANK_STATEMENT: 'upload-bank-statement',

  // Expenses
  VIEW_EXPENSES: 'view-expenses',
  CREATE_EXPENSE: 'create-expense',
  READ_EXPENSE: 'read-expense',
  UPDATE_EXPENSE: 'update-expense',
  DELETE_EXPENSE: 'delete-expense',

  // Inventory
  VIEW_INVENTORY: 'view-inventory',
  CREATE_INVENTORY: 'create-inventory',
  READ_INVENTORY: 'read-inventory',
  UPDATE_INVENTORY: 'update-inventory',
  DELETE_INVENTORY: 'delete-inventory',

  // Asset Management
  VIEW_ASSETS: 'view-assets',
  CREATE_ASSET: 'create-asset',
  READ_ASSET: 'read-asset',
  UPDATE_ASSET: 'update-asset',
  DELETE_ASSET: 'delete-asset',
  DISPOSE_ASSET: 'dispose-asset',
  REVALUE_ASSET: 'revalue-asset',
  CALC_DEPRECIATION: 'calc-depreciation',

  // Financial Reports
  VIEW_INCOME_STATEMENT: 'view-income-statement',
  VIEW_BALANCE_SHEET: 'view-balance-sheet',
  VIEW_CASHFLOW: 'view-cashflow',

  // Settings – Currencies
  CREATE_CURRENCY: 'create-currency',
  READ_CURRENCY: 'read-currency',
  UPDATE_CURRENCY: 'update-currency',
  DELETE_CURRENCY: 'delete-currency',

  // Settings – Exchange Rates
  CREATE_EXCHANGE_RATE: 'create-exchange-rate',
  READ_EXCHANGE_RATE: 'read-exchange-rate',
  UPDATE_EXCHANGE_RATE: 'update-exchange-rate',
  DELETE_EXCHANGE_RATE: 'delete-exchange-rate',

  // Settings – Chart of Accounts
  CREATE_COA: 'create-coa',
  READ_COA: 'read-coa',
  UPDATE_COA: 'update-coa',
  DELETE_COA: 'delete-coa',

  // Settings – Customers
  CREATE_CUSTOMER: 'create-customer',
  READ_CUSTOMER: 'read-customer',
  UPDATE_CUSTOMER: 'update-customer',
  DELETE_CUSTOMER: 'delete-customer',

  // Settings – Vendors
  CREATE_VENDOR: 'create-vendor',
  READ_VENDOR: 'read-vendor',
  UPDATE_VENDOR: 'update-vendor',
  DELETE_VENDOR: 'delete-vendor',

  // Settings – Expense Categories
  CREATE_EXPENSE_CATEGORY: 'create-expense-category',
  READ_EXPENSE_CATEGORY: 'read-expense-category',
  UPDATE_EXPENSE_CATEGORY: 'update-expense-category',
  DELETE_EXPENSE_CATEGORY: 'delete-expense-category',
} as const;

export type AccountingAction = typeof ACCOUNTING_ACTIONS[keyof typeof ACCOUNTING_ACTIONS];

// ---------------------------------------------------------------------------
// Helper – collect all action string values
// ---------------------------------------------------------------------------
const ALL_ACTIONS = Object.values(ACCOUNTING_ACTIONS);

// ---------------------------------------------------------------------------
// Per-Role Action Maps  (source-of-truth: permissions-matrix-2026-03-03.json)
// ---------------------------------------------------------------------------

/** CFO – all actions */
const CFO_ACTIONS: readonly string[] = [...ALL_ACTIONS];

/** CEO – identical to CFO per the matrix */
const CEO_ACTIONS: readonly string[] = [...ALL_ACTIONS];

/** SYSADMIN – identical to CFO per the matrix */
const SYSADMIN_ACTIONS: readonly string[] = [...ALL_ACTIONS];

/** FIN_MGR – all actions */
const FIN_MGR_ACTIONS: readonly string[] = [...ALL_ACTIONS];

/** FIN_OFF – most CRUD, but NO deletes on invoices/credit-notes/expenses/assets, NO settings deletes except customers */
const FIN_OFF_ACTIONS: readonly string[] = [
  // Dashboard
  ACCOUNTING_ACTIONS.VIEW_DASHBOARD,
  // General Ledger
  ACCOUNTING_ACTIONS.CREATE_JOURNAL_ENTRY,
  // Cash Book
  ACCOUNTING_ACTIONS.VIEW_CASHBOOK,
  ACCOUNTING_ACTIONS.PROCESS_CASHBOOK,
  // Invoices
  ACCOUNTING_ACTIONS.VIEW_INVOICES,
  ACCOUNTING_ACTIONS.CREATE_INVOICE,
  ACCOUNTING_ACTIONS.READ_INVOICE,
  ACCOUNTING_ACTIONS.UPDATE_INVOICE,
  // no DELETE_INVOICE
  ACCOUNTING_ACTIONS.MARK_INVOICE_PAID,
  // Credit Notes
  ACCOUNTING_ACTIONS.VIEW_CREDIT_NOTES,
  ACCOUNTING_ACTIONS.CREATE_CREDIT_NOTE,
  ACCOUNTING_ACTIONS.READ_CREDIT_NOTE,
  ACCOUNTING_ACTIONS.UPDATE_CREDIT_NOTE,
  // no DELETE_CREDIT_NOTE
  // Payables
  ACCOUNTING_ACTIONS.CREATE_PURCHASE_ORDER,
  ACCOUNTING_ACTIONS.VIEW_PURCHASE_ORDER,
  ACCOUNTING_ACTIONS.CREATE_PAYABLE,
  ACCOUNTING_ACTIONS.VIEW_PAYABLE,
  ACCOUNTING_ACTIONS.UPDATE_PAYABLE,
  // no DELETE_PAYABLE for FIN_OFF
  ACCOUNTING_ACTIONS.MARK_PAYABLE_PAID,
  // Bank Reconciliation
  ACCOUNTING_ACTIONS.VIEW_BANK_RECONCILIATION,
  ACCOUNTING_ACTIONS.UPLOAD_BANK_STATEMENT,
  // Expenses
  ACCOUNTING_ACTIONS.VIEW_EXPENSES,
  ACCOUNTING_ACTIONS.CREATE_EXPENSE,
  ACCOUNTING_ACTIONS.READ_EXPENSE,
  ACCOUNTING_ACTIONS.UPDATE_EXPENSE,
  // no DELETE_EXPENSE
  // Inventory
  ACCOUNTING_ACTIONS.VIEW_INVENTORY,
  ACCOUNTING_ACTIONS.CREATE_INVENTORY,
  ACCOUNTING_ACTIONS.READ_INVENTORY,
  ACCOUNTING_ACTIONS.UPDATE_INVENTORY,
  // no DELETE_INVENTORY
  // Assets
  ACCOUNTING_ACTIONS.VIEW_ASSETS,
  ACCOUNTING_ACTIONS.CREATE_ASSET,
  ACCOUNTING_ACTIONS.READ_ASSET,
  ACCOUNTING_ACTIONS.UPDATE_ASSET,
  // no DELETE_ASSET
  ACCOUNTING_ACTIONS.DISPOSE_ASSET,
  ACCOUNTING_ACTIONS.REVALUE_ASSET,
  ACCOUNTING_ACTIONS.CALC_DEPRECIATION,
  // Financial Reports
  ACCOUNTING_ACTIONS.VIEW_INCOME_STATEMENT,
  ACCOUNTING_ACTIONS.VIEW_BALANCE_SHEET,
  ACCOUNTING_ACTIONS.VIEW_CASHFLOW,
  // Settings – Currencies
  ACCOUNTING_ACTIONS.CREATE_CURRENCY,
  ACCOUNTING_ACTIONS.READ_CURRENCY,
  ACCOUNTING_ACTIONS.UPDATE_CURRENCY,
  // no DELETE_CURRENCY
  // Settings – Exchange Rates
  ACCOUNTING_ACTIONS.CREATE_EXCHANGE_RATE,
  ACCOUNTING_ACTIONS.READ_EXCHANGE_RATE,
  ACCOUNTING_ACTIONS.UPDATE_EXCHANGE_RATE,
  // no DELETE_EXCHANGE_RATE
  // Settings – Chart of Accounts
  ACCOUNTING_ACTIONS.CREATE_COA,
  ACCOUNTING_ACTIONS.READ_COA,
  ACCOUNTING_ACTIONS.UPDATE_COA,
  // no DELETE_COA
  // Settings – Customers
  ACCOUNTING_ACTIONS.CREATE_CUSTOMER,
  ACCOUNTING_ACTIONS.READ_CUSTOMER,
  ACCOUNTING_ACTIONS.UPDATE_CUSTOMER,
  ACCOUNTING_ACTIONS.DELETE_CUSTOMER, // FIN_OFF CAN delete customers per matrix
  // Settings – Vendors
  ACCOUNTING_ACTIONS.CREATE_VENDOR,
  ACCOUNTING_ACTIONS.READ_VENDOR,
  ACCOUNTING_ACTIONS.UPDATE_VENDOR,
  // no DELETE_VENDOR
  // Settings – Expense Categories
  ACCOUNTING_ACTIONS.CREATE_EXPENSE_CATEGORY,
  ACCOUNTING_ACTIONS.READ_EXPENSE_CATEGORY,
  ACCOUNTING_ACTIONS.UPDATE_EXPENSE_CATEGORY,
  // no DELETE_EXPENSE_CATEGORY
];

/** COMPLIANCE_OFF_INV – View/Read across most pages */
const COMPLIANCE_OFF_INV_ACTIONS: readonly string[] = [
  ACCOUNTING_ACTIONS.VIEW_DASHBOARD,
  ACCOUNTING_ACTIONS.VIEW_CASHBOOK,
  ACCOUNTING_ACTIONS.VIEW_INVOICES,
  ACCOUNTING_ACTIONS.READ_INVOICE,
  ACCOUNTING_ACTIONS.VIEW_CREDIT_NOTES,
  ACCOUNTING_ACTIONS.READ_CREDIT_NOTE,
  ACCOUNTING_ACTIONS.VIEW_BANK_RECONCILIATION,
  ACCOUNTING_ACTIONS.VIEW_EXPENSES,
  ACCOUNTING_ACTIONS.READ_EXPENSE,
  ACCOUNTING_ACTIONS.VIEW_INVENTORY,
  ACCOUNTING_ACTIONS.READ_INVENTORY,
  ACCOUNTING_ACTIONS.DELETE_INVENTORY, // per matrix: COMPLIANCE_OFF_INV can delete inventory
  ACCOUNTING_ACTIONS.VIEW_ASSETS,
  ACCOUNTING_ACTIONS.READ_ASSET,
  // no financial reports in matrix for COMPLIANCE_OFF_INV
  // Settings – Read only
  ACCOUNTING_ACTIONS.READ_CURRENCY,
  ACCOUNTING_ACTIONS.READ_EXCHANGE_RATE,
  ACCOUNTING_ACTIONS.READ_COA,
  ACCOUNTING_ACTIONS.READ_CUSTOMER,
  ACCOUNTING_ACTIONS.READ_VENDOR,
  ACCOUNTING_ACTIONS.READ_EXPENSE_CATEGORY,
];

/** EXT_AUDITOR – View across select pages + upload statement + calc depreciation */
const EXT_AUDITOR_ACTIONS: readonly string[] = [
  ACCOUNTING_ACTIONS.VIEW_DASHBOARD,
  ACCOUNTING_ACTIONS.VIEW_CASHBOOK,
  ACCOUNTING_ACTIONS.VIEW_INVOICES,
  ACCOUNTING_ACTIONS.VIEW_CREDIT_NOTES,
  ACCOUNTING_ACTIONS.VIEW_BANK_RECONCILIATION,
  ACCOUNTING_ACTIONS.UPLOAD_BANK_STATEMENT,
  ACCOUNTING_ACTIONS.VIEW_EXPENSES,
  ACCOUNTING_ACTIONS.VIEW_INVENTORY,
  ACCOUNTING_ACTIONS.VIEW_ASSETS,
  ACCOUNTING_ACTIONS.CALC_DEPRECIATION,
  ACCOUNTING_ACTIONS.VIEW_INCOME_STATEMENT,
  ACCOUNTING_ACTIONS.VIEW_BALANCE_SHEET,
  ACCOUNTING_ACTIONS.VIEW_CASHFLOW,
];

/** PORTFOLIO_MGR – only credit note read per matrix */
const PORTFOLIO_MGR_ACTIONS: readonly string[] = [
  ACCOUNTING_ACTIONS.READ_CREDIT_NOTE,
];

// ---------------------------------------------------------------------------
// Role → Actions mapping
// ---------------------------------------------------------------------------
export const ACCOUNTING_ROLE_PERMISSIONS: Record<string, {
  actions: readonly string[];
}> = {
  CFO:                { actions: CFO_ACTIONS },
  CEO:                { actions: CEO_ACTIONS },
  SYSADMIN:           { actions: SYSADMIN_ACTIONS },
  FIN_MGR:            { actions: FIN_MGR_ACTIONS },
  FIN_OFF:            { actions: FIN_OFF_ACTIONS },
  ACCOUNTANT:         { actions: FIN_OFF_ACTIONS },  // same as FIN_OFF per matrix
  FIN_ASST:           { actions: FIN_OFF_ACTIONS },  // same as FIN_OFF per matrix
  COMPLIANCE_OFF_INV: { actions: COMPLIANCE_OFF_INV_ACTIONS },
  EXT_AUDITOR:        { actions: EXT_AUDITOR_ACTIONS },
  PORTFOLIO_MGR:      { actions: PORTFOLIO_MGR_ACTIONS },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Check whether a role can perform a specific accounting action.
 * Returns false for any role not explicitly listed.
 */
export function canPerformAccountingAction(
  roleCode: string,
  action: string
): boolean {
  const rolePerms = ACCOUNTING_ROLE_PERMISSIONS[roleCode];
  if (!rolePerms) return false;
  return (rolePerms.actions as readonly string[]).includes(action);
}

/**
 * Sub-module access level derived from the per-action map.
 * 
 * Maps sub-module IDs (from modules.ts) to the "view" action that controls
 * whether the user can see it in the sidebar / page guard.
 */
const SUB_MODULE_VIEW_ACTIONS: Record<string, string> = {
  'accounting-dashboard':   ACCOUNTING_ACTIONS.VIEW_DASHBOARD,
  'general-ledger':         ACCOUNTING_ACTIONS.CREATE_JOURNAL_ENTRY,
  'cash-book':              ACCOUNTING_ACTIONS.VIEW_CASHBOOK,
  'invoices':               ACCOUNTING_ACTIONS.VIEW_INVOICES,
  'payables':               ACCOUNTING_ACTIONS.VIEW_PURCHASE_ORDER,
  'bank-reconciliation':    ACCOUNTING_ACTIONS.VIEW_BANK_RECONCILIATION,
  'expenses':               ACCOUNTING_ACTIONS.VIEW_EXPENSES,
  'inventory-accounting':   ACCOUNTING_ACTIONS.VIEW_INVENTORY,
  'asset-management':       ACCOUNTING_ACTIONS.VIEW_ASSETS,
  'financial-reports':      ACCOUNTING_ACTIONS.VIEW_INCOME_STATEMENT,
  'accounting-settings':    ACCOUNTING_ACTIONS.READ_CURRENCY, // at least one settings read
};

/**
 * Check if a role has access to a given accounting sub-module.
 * Used by the sidebar filter and ModuleGuard.
 */
export function hasAccountingSubModuleAccess(
  roleCode: string,
  subModuleId: string
): boolean {
  const viewAction = SUB_MODULE_VIEW_ACTIONS[subModuleId];
  if (!viewAction) return false;
  return canPerformAccountingAction(roleCode, viewAction);
}
