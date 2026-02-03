'use client';

import { useMemo } from 'react';
import { useRolePermissions } from './useRolePermissions';
import { 
  PROCUREMENT_ACTIONS, 
  canPerformProcurementAction,
  getProcurementModuleAccess 
} from '../config/procurement-permissions';

/**
 * Hook for procurement-specific permissions
 * Provides easy access to procurement actions and sub-module permissions
 */
export function useProcurementPermissions() {
  const { roleCode, hasModuleAccess, isLoading } = useRolePermissions();

  const hasProcurementAccess = useMemo(() => {
    return hasModuleAccess('procurement');
  }, [hasModuleAccess]);

  const canPerformAction = useMemo(() => {
    return (action: string) => {
      if (!roleCode) return false;
      return canPerformProcurementAction(roleCode, action);
    };
  }, [roleCode]);

  const getModuleAccess = useMemo(() => {
    return (subModule: string) => {
      if (!roleCode) return 'none' as const;
      return getProcurementModuleAccess(roleCode, subModule as any);
    };
  }, [roleCode]);

  // Common permission checks
  const permissions = useMemo(() => ({
    // Dashboard
    canViewDashboard: canPerformAction(PROCUREMENT_ACTIONS.VIEW_DASHBOARD),
    canViewAnalytics: canPerformAction(PROCUREMENT_ACTIONS.VIEW_ANALYTICS),

    // Purchase Requisitions
    canCreatePurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION),
    canViewOwnPurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION),
    canViewAllPurchaseRequisitions: canPerformAction(PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS),
    canUpdatePurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_PURCHASE_REQUISITION),
    canDeletePurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.DELETE_PURCHASE_REQUISITION),
    canApprovePurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_PURCHASE_REQUISITION),
    canRejectPurchaseRequisition: canPerformAction(PROCUREMENT_ACTIONS.REJECT_PURCHASE_REQUISITION),

    // RFQ
    canCreateRFQ: canPerformAction(PROCUREMENT_ACTIONS.CREATE_RFQ),
    canViewRFQ: canPerformAction(PROCUREMENT_ACTIONS.VIEW_RFQ),
    canUpdateRFQ: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_RFQ),
    canDeleteRFQ: canPerformAction(PROCUREMENT_ACTIONS.DELETE_RFQ),
    canSendRFQ: canPerformAction(PROCUREMENT_ACTIONS.SEND_RFQ),
    canCloseRFQ: canPerformAction(PROCUREMENT_ACTIONS.CLOSE_RFQ),

    // Quotations
    canViewQuotation: canPerformAction(PROCUREMENT_ACTIONS.VIEW_QUOTATION),
    canReviewQuotation: canPerformAction(PROCUREMENT_ACTIONS.REVIEW_QUOTATION),
    canAcceptQuotation: canPerformAction(PROCUREMENT_ACTIONS.ACCEPT_QUOTATION),
    canRejectQuotation: canPerformAction(PROCUREMENT_ACTIONS.REJECT_QUOTATION),
    canCompareQuotations: canPerformAction(PROCUREMENT_ACTIONS.COMPARE_QUOTATIONS),

    // Purchase Orders
    canCreatePurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.CREATE_PURCHASE_ORDER),
    canViewPurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.VIEW_PURCHASE_ORDER),
    canUpdatePurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_PURCHASE_ORDER),
    canDeletePurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.DELETE_PURCHASE_ORDER),
    canApprovePurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_PURCHASE_ORDER),
    canSendPurchaseOrder: canPerformAction(PROCUREMENT_ACTIONS.SEND_PURCHASE_ORDER),

    // Invoices
    canCreateInvoice: canPerformAction(PROCUREMENT_ACTIONS.CREATE_INVOICE),
    canViewInvoice: canPerformAction(PROCUREMENT_ACTIONS.VIEW_INVOICE),
    canUpdateInvoice: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_INVOICE),
    canDeleteInvoice: canPerformAction(PROCUREMENT_ACTIONS.DELETE_INVOICE),
    canApproveInvoice: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_INVOICE),

    // GRN
    canCreateGRN: canPerformAction(PROCUREMENT_ACTIONS.CREATE_GRN),
    canViewGRN: canPerformAction(PROCUREMENT_ACTIONS.VIEW_GRN),
    canUpdateGRN: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_GRN),
    canDeleteGRN: canPerformAction(PROCUREMENT_ACTIONS.DELETE_GRN),
    canApproveGRN: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_GRN),

    // Payments
    canViewPayment: canPerformAction(PROCUREMENT_ACTIONS.VIEW_PAYMENT),
    canCreatePayment: canPerformAction(PROCUREMENT_ACTIONS.CREATE_PAYMENT),
    canApprovePayment: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_PAYMENT),
    canProcessPayment: canPerformAction(PROCUREMENT_ACTIONS.PROCESS_PAYMENT),

    // Approval Configurations
    canCreateApprovalConfig: canPerformAction(PROCUREMENT_ACTIONS.CREATE_APPROVAL_CONFIG),
    canViewApprovalConfig: canPerformAction(PROCUREMENT_ACTIONS.VIEW_APPROVAL_CONFIG),
    canUpdateApprovalConfig: canPerformAction(PROCUREMENT_ACTIONS.UPDATE_APPROVAL_CONFIG),
    canDeleteApprovalConfig: canPerformAction(PROCUREMENT_ACTIONS.DELETE_APPROVAL_CONFIG),

    // My Approvals
    canViewMyApprovals: canPerformAction(PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS),
    canApproveRequest: canPerformAction(PROCUREMENT_ACTIONS.APPROVE_REQUEST),
    canRejectRequest: canPerformAction(PROCUREMENT_ACTIONS.REJECT_REQUEST),
  }), [canPerformAction]);

  // Module-level access
  const moduleAccess = useMemo(() => ({
    dashboard: getModuleAccess('dashboard'),
    purchaseRequisitions: getModuleAccess('purchaseRequisitions'),
    rfq: getModuleAccess('rfq'),
    quotations: getModuleAccess('quotations'),
    purchaseOrders: getModuleAccess('purchaseOrders'),
    invoices: getModuleAccess('invoices'),
    goodsReceivedNotes: getModuleAccess('goodsReceivedNotes'),
    payments: getModuleAccess('payments'),
    approvalConfigurations: getModuleAccess('approvalConfigurations'),
    myApprovals: getModuleAccess('myApprovals'),
  }), [getModuleAccess]);

  return {
    roleCode,
    isLoading,
    hasProcurementAccess,
    permissions,
    moduleAccess,
    canPerformAction,
    getModuleAccess,
  };
}
