/**
 * Procurement Module Specific Permissions
 * Based on the permissions matrix from CSV
 */

export const PROCUREMENT_ACTIONS = {
  // Dashboard Actions
  VIEW_DASHBOARD: 'view-procurement-dashboard',
  VIEW_ANALYTICS: 'view-procurement-analytics',
  
  // Purchase Requisitions
  CREATE_PURCHASE_REQUISITION: 'create-purchase-requisition',
  VIEW_OWN_PURCHASE_REQUISITION: 'view-own-purchase-requisition',
  VIEW_ALL_PURCHASE_REQUISITIONS: 'view-all-purchase-requisitions',
  UPDATE_PURCHASE_REQUISITION: 'update-purchase-requisition',
  DELETE_PURCHASE_REQUISITION: 'delete-purchase-requisition',
  APPROVE_PURCHASE_REQUISITION: 'approve-purchase-requisition',
  REJECT_PURCHASE_REQUISITION: 'reject-purchase-requisition',
  
  // RFQ (Request for Quotation)
  CREATE_RFQ: 'create-rfq',
  VIEW_RFQ: 'view-rfq',
  UPDATE_RFQ: 'update-rfq',
  DELETE_RFQ: 'delete-rfq',
  SEND_RFQ: 'send-rfq',
  CLOSE_RFQ: 'close-rfq',
  
  // Quotations
  VIEW_QUOTATION: 'view-quotation',
  REVIEW_QUOTATION: 'review-quotation',
  ACCEPT_QUOTATION: 'accept-quotation',
  REJECT_QUOTATION: 'reject-quotation',
  COMPARE_QUOTATIONS: 'compare-quotations',
  
  // Purchase Orders
  CREATE_PURCHASE_ORDER: 'create-purchase-order',
  VIEW_PURCHASE_ORDER: 'view-purchase-order',
  UPDATE_PURCHASE_ORDER: 'update-purchase-order',
  DELETE_PURCHASE_ORDER: 'delete-purchase-order',
  APPROVE_PURCHASE_ORDER: 'approve-purchase-order',
  SEND_PURCHASE_ORDER: 'send-purchase-order',
  
  // Invoices
  CREATE_INVOICE: 'create-procurement-invoice',
  VIEW_INVOICE: 'view-procurement-invoice',
  UPDATE_INVOICE: 'update-procurement-invoice',
  DELETE_INVOICE: 'delete-procurement-invoice',
  APPROVE_INVOICE: 'approve-procurement-invoice',
  
  // Goods Received Notes
  CREATE_GRN: 'create-grn',
  VIEW_GRN: 'view-grn',
  UPDATE_GRN: 'update-grn',
  DELETE_GRN: 'delete-grn',
  APPROVE_GRN: 'approve-grn',
  
  // Payments
  VIEW_PAYMENT: 'view-procurement-payment',
  CREATE_PAYMENT: 'create-procurement-payment',
  APPROVE_PAYMENT: 'approve-procurement-payment',
  PROCESS_PAYMENT: 'process-procurement-payment',
  
  // Approval Configurations
  CREATE_APPROVAL_CONFIG: 'create-approval-config',
  VIEW_APPROVAL_CONFIG: 'view-approval-config',
  UPDATE_APPROVAL_CONFIG: 'update-approval-config',
  DELETE_APPROVAL_CONFIG: 'delete-approval-config',
  
  // My Approvals
  VIEW_MY_APPROVALS: 'view-my-approvals',
  APPROVE_REQUEST: 'approve-request',
  REJECT_REQUEST: 'reject-request',
} as const;

/**
 * Procurement Role Permissions Map
 * Based on CSV data analysis:
 * 
 * CEO: Full Dashboard access (X)
 * CFO: Full access to all procurement features (X)
 * CIO: Dashboard only (X)
 * Procurement Manager (HOD): Full access to all except approval configs
 * Procurement Officer: Full access to operations
 * Everyone: Can create and view their own purchase requisitions
 */
export const PROCUREMENT_ROLE_PERMISSIONS = {
  // C-Level Executives
  CEO: {
    dashboard: 'full',
    purchaseRequisitions: 'read', // Can view all
    rfq: 'read',
    quotations: 'read',
    purchaseOrders: 'read',
    invoices: 'read',
    goodsReceivedNotes: 'read',
    payments: 'read',
    approvalConfigurations: 'full', // Only CEO can manage
    myApprovals: 'full',
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
    ]
  },
  
  CFO: {
    dashboard: 'full',
    purchaseRequisitions: 'full',
    rfq: 'full',
    quotations: 'full',
    purchaseOrders: 'full',
    invoices: 'full',
    goodsReceivedNotes: 'full',
    payments: 'full',
    approvalConfigurations: 'full',
    myApprovals: 'full',
    actions: Object.values(PROCUREMENT_ACTIONS),
  },
  
  CIO: {
    dashboard: 'full',
    purchaseRequisitions: 'none',
    rfq: 'none',
    quotations: 'none',
    purchaseOrders: 'none',
    invoices: 'none',
    goodsReceivedNotes: 'none',
    payments: 'none',
    approvalConfigurations: 'none',
    myApprovals: 'read',
    actions: [
      PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
      PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
    ]
  },
  
  // Procurement Team
  PROC_MGR: { // HOD for Procurement
    dashboard: 'full',
    purchaseRequisitions: 'full',
    rfq: 'full',
    quotations: 'full',
    purchaseOrders: 'full',
    invoices: 'full',
    goodsReceivedNotes: 'full',
    payments: 'full',
    approvalConfigurations: 'read',
    myApprovals: 'full',
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
      PROCUREMENT_ACTIONS.VIEW_APPROVAL_CONFIG,
      PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
      PROCUREMENT_ACTIONS.APPROVE_REQUEST,
      PROCUREMENT_ACTIONS.REJECT_REQUEST,
    ]
  },
  
  PROC_OFF: { // Procurement Officer
    dashboard: 'full',
    purchaseRequisitions: 'full',
    rfq: 'full',
    quotations: 'full',
    purchaseOrders: 'full',
    invoices: 'full',
    goodsReceivedNotes: 'full',
    payments: 'full',
    approvalConfigurations: 'none',
    myApprovals: 'full',
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
    ]
  },
  
  BUYER: { // Procurement Buyer
    dashboard: 'read',
    purchaseRequisitions: 'full',
    rfq: 'full',
    quotations: 'full',
    purchaseOrders: 'write',
    invoices: 'write',
    goodsReceivedNotes: 'write',
    payments: 'read',
    approvalConfigurations: 'none',
    myApprovals: 'read',
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
    ]
  },
  
  // Finance Department
  FIN_MGR: { // Head of Finance / Department Manager for Finance
    dashboard: 'full',
    purchaseRequisitions: 'read',
    rfq: 'read',
    quotations: 'read',
    purchaseOrders: 'read',
    invoices: 'full',
    goodsReceivedNotes: 'read',
    payments: 'full',
    approvalConfigurations: 'read',
    myApprovals: 'full',
    actions: [
      PROCUREMENT_ACTIONS.VIEW_DASHBOARD,
      PROCUREMENT_ACTIONS.VIEW_ANALYTICS,
      PROCUREMENT_ACTIONS.VIEW_ALL_PURCHASE_REQUISITIONS,
      PROCUREMENT_ACTIONS.APPROVE_PURCHASE_REQUISITION,
      PROCUREMENT_ACTIONS.REJECT_PURCHASE_REQUISITION,
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
      PROCUREMENT_ACTIONS.VIEW_APPROVAL_CONFIG,
      PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
      PROCUREMENT_ACTIONS.APPROVE_REQUEST,
      PROCUREMENT_ACTIONS.REJECT_REQUEST,
    ]
  },
  
  // All other employees
  EVERYONE: {
    dashboard: 'none',
    purchaseRequisitions: 'write', // Can create and view own
    rfq: 'none',
    quotations: 'none',
    purchaseOrders: 'none',
    invoices: 'none',
    goodsReceivedNotes: 'none',
    payments: 'none',
    approvalConfigurations: 'none',
    myApprovals: 'read',
    actions: [
      PROCUREMENT_ACTIONS.CREATE_PURCHASE_REQUISITION,
      PROCUREMENT_ACTIONS.VIEW_OWN_PURCHASE_REQUISITION,
      PROCUREMENT_ACTIONS.UPDATE_PURCHASE_REQUISITION, // Own only
      PROCUREMENT_ACTIONS.VIEW_MY_APPROVALS,
    ]
  },
} as const;

/**
 * Check if a role has specific procurement action permission
 */
export function canPerformProcurementAction(
  roleCode: string, 
  action: string
): boolean {
  const rolePerms = PROCUREMENT_ROLE_PERMISSIONS[roleCode as keyof typeof PROCUREMENT_ROLE_PERMISSIONS] 
    || PROCUREMENT_ROLE_PERMISSIONS.EVERYONE;
  
  return (rolePerms.actions as readonly string[]).includes(action);
}

/**
 * Get procurement sub-module access level
 */
export function getProcurementModuleAccess(
  roleCode: string,
  subModule: keyof typeof PROCUREMENT_ROLE_PERMISSIONS.CEO
): 'full' | 'read' | 'write' | 'none' {
  const rolePerms = PROCUREMENT_ROLE_PERMISSIONS[roleCode as keyof typeof PROCUREMENT_ROLE_PERMISSIONS] 
    || PROCUREMENT_ROLE_PERMISSIONS.EVERYONE;
  
  const access = rolePerms[subModule];
  
  if (typeof access === 'string' && (access === 'full' || access === 'read' || access === 'write' || access === 'none')) {
    return access;
  }
  
  return 'none';
}
