/**
 * Accounting Module Permissions Hook
 *
 * Provides fine-grained, named boolean permission flags for every action
 * defined in the accounting permissions matrix.
 *
 * Usage:
 *   const { permissions, canPerformAction, hasModuleAccess } = useAccountingPermissions();
 *   if (permissions.canCreateInvoice) { ... }
 */

import { useMemo } from 'react';
import { useRolePermissions } from './useRolePermissions';
import {
  ACCOUNTING_ACTIONS,
  canPerformAccountingAction,
  hasAccountingSubModuleAccess,
} from '../config/accounting-permissions';

export function useAccountingPermissions() {
  const { roleCode, hasModuleAccess, isLoading } = useRolePermissions();

  // Convenience helper – checks action on the current role
  const canPerformAction = useMemo(
    () => (action: string) => canPerformAccountingAction(roleCode || '', action),
    [roleCode]
  );

  // Sub-module access (for sidebar / guards)
  const subModuleAccess = useMemo(() => ({
    dashboard:          hasAccountingSubModuleAccess(roleCode || '', 'accounting-dashboard'),
    generalLedger:      hasAccountingSubModuleAccess(roleCode || '', 'general-ledger'),
    cashBook:           hasAccountingSubModuleAccess(roleCode || '', 'cash-book'),
    invoices:           hasAccountingSubModuleAccess(roleCode || '', 'invoices'),
    payables:           hasAccountingSubModuleAccess(roleCode || '', 'payables'),
    bankReconciliation: hasAccountingSubModuleAccess(roleCode || '', 'bank-reconciliation'),
    expenses:           hasAccountingSubModuleAccess(roleCode || '', 'expenses'),
    inventory:          hasAccountingSubModuleAccess(roleCode || '', 'inventory-accounting'),
    assetManagement:    hasAccountingSubModuleAccess(roleCode || '', 'asset-management'),
    financialReports:   hasAccountingSubModuleAccess(roleCode || '', 'financial-reports'),
    settings:           hasAccountingSubModuleAccess(roleCode || '', 'accounting-settings'),
  }), [roleCode]);

  // Named boolean flags – one per matrix action
  const permissions = useMemo(() => ({
    // Dashboard
    canViewDashboard: canPerformAction(ACCOUNTING_ACTIONS.VIEW_DASHBOARD),

    // General Ledger
    canCreateJournalEntry: canPerformAction(ACCOUNTING_ACTIONS.CREATE_JOURNAL_ENTRY),

    // Cash Book
    canViewCashbook: canPerformAction(ACCOUNTING_ACTIONS.VIEW_CASHBOOK),
    canProcessCashbook: canPerformAction(ACCOUNTING_ACTIONS.PROCESS_CASHBOOK),

    // Invoices (AR)
    canViewInvoices: canPerformAction(ACCOUNTING_ACTIONS.VIEW_INVOICES),
    canCreateInvoice: canPerformAction(ACCOUNTING_ACTIONS.CREATE_INVOICE),
    canReadInvoice: canPerformAction(ACCOUNTING_ACTIONS.READ_INVOICE),
    canUpdateInvoice: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_INVOICE),
    canDeleteInvoice: canPerformAction(ACCOUNTING_ACTIONS.DELETE_INVOICE),
    canMarkInvoicePaid: canPerformAction(ACCOUNTING_ACTIONS.MARK_INVOICE_PAID),

    // Credit Notes
    canViewCreditNotes: canPerformAction(ACCOUNTING_ACTIONS.VIEW_CREDIT_NOTES),
    canCreateCreditNote: canPerformAction(ACCOUNTING_ACTIONS.CREATE_CREDIT_NOTE),
    canReadCreditNote: canPerformAction(ACCOUNTING_ACTIONS.READ_CREDIT_NOTE),
    canUpdateCreditNote: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_CREDIT_NOTE),
    canDeleteCreditNote: canPerformAction(ACCOUNTING_ACTIONS.DELETE_CREDIT_NOTE),

    // Accounts Payable
    canCreatePurchaseOrder: canPerformAction(ACCOUNTING_ACTIONS.CREATE_PURCHASE_ORDER),
    canViewPurchaseOrder: canPerformAction(ACCOUNTING_ACTIONS.VIEW_PURCHASE_ORDER),
    canCreatePayable: canPerformAction(ACCOUNTING_ACTIONS.CREATE_PAYABLE),
    canViewPayable: canPerformAction(ACCOUNTING_ACTIONS.VIEW_PAYABLE),
    canEditPayable: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_PAYABLE),
    canDeletePayable: canPerformAction(ACCOUNTING_ACTIONS.DELETE_PAYABLE),
    canMarkPayablePaid: canPerformAction(ACCOUNTING_ACTIONS.MARK_PAYABLE_PAID),

    // Bank Reconciliation
    canViewBankReconciliation: canPerformAction(ACCOUNTING_ACTIONS.VIEW_BANK_RECONCILIATION),
    canUploadBankStatement: canPerformAction(ACCOUNTING_ACTIONS.UPLOAD_BANK_STATEMENT),

    // Expenses
    canViewExpenses: canPerformAction(ACCOUNTING_ACTIONS.VIEW_EXPENSES),
    canCreateExpense: canPerformAction(ACCOUNTING_ACTIONS.CREATE_EXPENSE),
    canReadExpense: canPerformAction(ACCOUNTING_ACTIONS.READ_EXPENSE),
    canUpdateExpense: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_EXPENSE),
    canDeleteExpense: canPerformAction(ACCOUNTING_ACTIONS.DELETE_EXPENSE),

    // Inventory
    canViewInventory: canPerformAction(ACCOUNTING_ACTIONS.VIEW_INVENTORY),
    canCreateInventory: canPerformAction(ACCOUNTING_ACTIONS.CREATE_INVENTORY),
    canReadInventory: canPerformAction(ACCOUNTING_ACTIONS.READ_INVENTORY),
    canUpdateInventory: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_INVENTORY),
    canDeleteInventory: canPerformAction(ACCOUNTING_ACTIONS.DELETE_INVENTORY),

    // Asset Management
    canViewAssets: canPerformAction(ACCOUNTING_ACTIONS.VIEW_ASSETS),
    canCreateAsset: canPerformAction(ACCOUNTING_ACTIONS.CREATE_ASSET),
    canReadAsset: canPerformAction(ACCOUNTING_ACTIONS.READ_ASSET),
    canUpdateAsset: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_ASSET),
    canDeleteAsset: canPerformAction(ACCOUNTING_ACTIONS.DELETE_ASSET),
    canDisposeAsset: canPerformAction(ACCOUNTING_ACTIONS.DISPOSE_ASSET),
    canRevalueAsset: canPerformAction(ACCOUNTING_ACTIONS.REVALUE_ASSET),
    canCalcDepreciation: canPerformAction(ACCOUNTING_ACTIONS.CALC_DEPRECIATION),

    // Financial Reports
    canViewIncomeStatement: canPerformAction(ACCOUNTING_ACTIONS.VIEW_INCOME_STATEMENT),
    canViewBalanceSheet: canPerformAction(ACCOUNTING_ACTIONS.VIEW_BALANCE_SHEET),
    canViewCashflow: canPerformAction(ACCOUNTING_ACTIONS.VIEW_CASHFLOW),

    // Settings – Currencies
    canCreateCurrency: canPerformAction(ACCOUNTING_ACTIONS.CREATE_CURRENCY),
    canReadCurrency: canPerformAction(ACCOUNTING_ACTIONS.READ_CURRENCY),
    canUpdateCurrency: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_CURRENCY),
    canDeleteCurrency: canPerformAction(ACCOUNTING_ACTIONS.DELETE_CURRENCY),

    // Settings – Exchange Rates
    canCreateExchangeRate: canPerformAction(ACCOUNTING_ACTIONS.CREATE_EXCHANGE_RATE),
    canReadExchangeRate: canPerformAction(ACCOUNTING_ACTIONS.READ_EXCHANGE_RATE),
    canUpdateExchangeRate: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_EXCHANGE_RATE),
    canDeleteExchangeRate: canPerformAction(ACCOUNTING_ACTIONS.DELETE_EXCHANGE_RATE),

    // Settings – Chart of Accounts
    canCreateCOA: canPerformAction(ACCOUNTING_ACTIONS.CREATE_COA),
    canReadCOA: canPerformAction(ACCOUNTING_ACTIONS.READ_COA),
    canUpdateCOA: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_COA),
    canDeleteCOA: canPerformAction(ACCOUNTING_ACTIONS.DELETE_COA),

    // Settings – Customers
    canCreateCustomer: canPerformAction(ACCOUNTING_ACTIONS.CREATE_CUSTOMER),
    canReadCustomer: canPerformAction(ACCOUNTING_ACTIONS.READ_CUSTOMER),
    canUpdateCustomer: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_CUSTOMER),
    canDeleteCustomer: canPerformAction(ACCOUNTING_ACTIONS.DELETE_CUSTOMER),

    // Settings – Vendors
    canCreateVendor: canPerformAction(ACCOUNTING_ACTIONS.CREATE_VENDOR),
    canReadVendor: canPerformAction(ACCOUNTING_ACTIONS.READ_VENDOR),
    canUpdateVendor: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_VENDOR),
    canDeleteVendor: canPerformAction(ACCOUNTING_ACTIONS.DELETE_VENDOR),

    // Settings – Expense Categories
    canCreateExpenseCategory: canPerformAction(ACCOUNTING_ACTIONS.CREATE_EXPENSE_CATEGORY),
    canReadExpenseCategory: canPerformAction(ACCOUNTING_ACTIONS.READ_EXPENSE_CATEGORY),
    canUpdateExpenseCategory: canPerformAction(ACCOUNTING_ACTIONS.UPDATE_EXPENSE_CATEGORY),
    canDeleteExpenseCategory: canPerformAction(ACCOUNTING_ACTIONS.DELETE_EXPENSE_CATEGORY),
  }), [canPerformAction]);

  return {
    roleCode,
    permissions,
    subModuleAccess,
    canPerformAction,
    isLoading,
    hasModuleAccess: hasModuleAccess('accounting'),
  };
}
