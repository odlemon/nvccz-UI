/**
 * Permissions System - Index









































































































































































































































































- Works with existing authentication system- Can be applied at page, section, or button level- Supports multiple access levels (full, read, write, none)### Flexible- Easy to extend for new roles or actions- Clear role-to-permission mapping- Centralized permission definitions### Maintainable- Clear permission naming- Type-safe permission checks- Custom hooks for easy integration### Easy to Use- Role-based data filtering- Module and sub-module level access- Action-level permissions for fine-grained access control### Granular Control## Key Features6. Test with different role codes5. Add loading states and error handling4. Update app switcher dropdown3. Filter data based on user role (e.g., show only own requisitions)2. Add permission checks to action buttons1. Apply permissions to procurement pages### Next Steps- ✅ FIN_MGR - Invoices + Payments focus- ✅ BUYER - Limited access- ✅ PROC_OFF - Full operational access- ✅ PROC_MGR - Full operational access- ✅ CIO - Dashboard only- ✅ CFO - Full access- ✅ CEO - Dashboard + Approval Configs### Roles Updated- ✅ `lib/permissions.ts` - Export updates- ✅ `lib/hooks/useProcurementPermissions.ts` - Custom hook- ✅ `lib/config/role-permissions.ts` - Updated with procurement actions- ✅ `lib/config/procurement-permissions.ts` - Procurement-specific permissions### Files Created/Updated## Implementation Checklist```}  }    // Show create button  if (canCreate) {    );    PROCUREMENT_ACTIONS.CREATE_RFQ    roleCode,   const canCreate = canPerformProcurementAction(function checkPermissions(roleCode: string) {import { canPerformProcurementAction, PROCUREMENT_ACTIONS } from '@/lib/permissions';```typescript### Direct Permission Check```}  );    </ActionGuard>      <RFQContent />    >      fallback={<AccessDenied />}      action={PROCUREMENT_ACTIONS.VIEW_RFQ}    <ActionGuard   return (function RFQPage() {import { PROCUREMENT_ACTIONS } from '@/lib/permissions';import { ActionGuard } from '@/lib/permissions';```typescript### Using Permission Guards```}  );    </>      )}        <RFQSection />      {moduleAccess.rfq !== 'none' && (            )}        <DashboardCard />      {permissions.canViewDashboard && (            )}        <Button onClick={handleCreate}>Create Requisition</Button>      {permissions.canCreatePurchaseRequisition && (    <>  return (  if (isLoading) return <div>Loading...</div>;  } = useProcurementPermissions();    isLoading     canPerformAction,    moduleAccess,    permissions,   const { function MyComponent() {import { useProcurementPermissions } from '@/lib/permissions';```typescript### Using the Hook## Usage in Components- `REJECT_REQUEST` - Reject requests- `APPROVE_REQUEST` - Approve requests- `VIEW_MY_APPROVALS` - View pending approvals### My Approvals- `DELETE_APPROVAL_CONFIG` - Delete configs (CEO only)- `UPDATE_APPROVAL_CONFIG` - Edit configs (CEO only)- `VIEW_APPROVAL_CONFIG` - View configs- `CREATE_APPROVAL_CONFIG` - Create config (CEO only)### Approval Configurations- `PROCESS_PAYMENT` - Process payment- `APPROVE_PAYMENT` - Approve payment- `CREATE_PAYMENT` - Create payment- `VIEW_PAYMENT` - View payments### Payments- `APPROVE_GRN` - Approve GRNs- `DELETE_GRN` - Delete GRNs- `UPDATE_GRN` - Edit GRNs- `VIEW_GRN` - View GRNs- `CREATE_GRN` - Create GRN### Goods Received Notes- `APPROVE_INVOICE` - Approve invoices- `DELETE_INVOICE` - Delete invoices- `UPDATE_INVOICE` - Edit invoices- `VIEW_INVOICE` - View invoices- `CREATE_INVOICE` - Create invoice### Invoices- `SEND_PURCHASE_ORDER` - Send to vendor- `APPROVE_PURCHASE_ORDER` - Approve POs- `DELETE_PURCHASE_ORDER` - Delete POs- `UPDATE_PURCHASE_ORDER` - Edit POs- `VIEW_PURCHASE_ORDER` - View POs- `CREATE_PURCHASE_ORDER` - Create new PO### Purchase Orders- `COMPARE_QUOTATIONS` - Compare multiple quotations- `REJECT_QUOTATION` - Reject quotations- `ACCEPT_QUOTATION` - Accept quotations- `REVIEW_QUOTATION` - Review quotations- `VIEW_QUOTATION` - View quotations### Quotations- `CLOSE_RFQ` - Close RFQ- `SEND_RFQ` - Send to vendors- `DELETE_RFQ` - Delete RFQs- `UPDATE_RFQ` - Edit RFQs- `VIEW_RFQ` - View RFQs- `CREATE_RFQ` - Create new RFQ### RFQ (Request for Quotation)- `REJECT_PURCHASE_REQUISITION` - Reject requisitions- `APPROVE_PURCHASE_REQUISITION` - Approve requisitions- `DELETE_PURCHASE_REQUISITION` - Delete requisitions- `UPDATE_PURCHASE_REQUISITION` - Edit requisitions- `VIEW_ALL_PURCHASE_REQUISITIONS` - View all requisitions- `VIEW_OWN_PURCHASE_REQUISITION` - View own requisitions- `CREATE_PURCHASE_REQUISITION` - Create new requisition### Purchase Requisitions## Available Actions- **My Approvals**: Read Only- **All Other Modules**: No Access- **Purchase Requisitions**: Can create and view their own only- **Dashboard**: No Access#### **All Other Employees (EVERYONE)**- **My Approvals**: Full Access ✓- **Approval Configurations**: Read Only- **Payments**: Full Access ✓- **Goods Received Notes**: Read Only- **Invoices**: Full Access ✓- **Purchase Orders**: Read Only- **Quotations**: Read Only- **RFQ**: Read Only- **Purchase Requisitions**: Read Only- **Dashboard**: Full Access ✓#### **Finance Manager (FIN_MGR)**- **My Approvals**: Read Only- **Approval Configurations**: No Access- **Payments**: Read Only- **Goods Received Notes**: Write Access- **Invoices**: Write Access- **Purchase Orders**: Write Access- **Quotations**: Full Access ✓- **RFQ**: Full Access ✓- **Purchase Requisitions**: Full Access ✓- **Dashboard**: Read Only#### **Buyer (BUYER)**- **My Approvals**: Full Access ✓- **Approval Configurations**: No Access- **Payments**: Full Access ✓- **Goods Received Notes**: Full Access ✓- **Invoices**: Full Access ✓- **Purchase Orders**: Full Access ✓- **Quotations**: Full Access ✓- **RFQ**: Full Access ✓- **Purchase Requisitions**: Full Access ✓- **Dashboard**: Full Access ✓#### **Procurement Officer (PROC_OFF)**- **My Approvals**: Full Access ✓- **Approval Configurations**: Read Only- **Payments**: Full Access ✓- **Goods Received Notes**: Full Access ✓- **Invoices**: Full Access ✓- **Purchase Orders**: Full Access ✓- **Quotations**: Full Access ✓- **RFQ**: Full Access ✓- **Purchase Requisitions**: Full Access ✓- **Dashboard**: Full Access ✓#### **Procurement Manager (PROC_MGR)** - HOD for Procurement- Can only view procurement analytics- **All Other Modules**: No Access- **Dashboard**: Full Access ✓#### **CIO**- Can perform all actions- Complete control over procurement operations- **All Modules**: Full Access ✓#### **CFO**- **My Approvals**: Full Access ✓- **Approval Configurations**: Full Access ✓ (Only CEO)- **Payments**: Read Only- **Goods Received Notes**: Read Only- **Invoices**: Read Only- **Purchase Orders**: Read Only- **Quotations**: Read Only- **RFQ**: Read Only  - **Purchase Requisitions**: Read Only- **Dashboard**: Full Access ✓#### **CEO**### Role-Based Access## Permissions StructureComprehensive role-based access control (RBAC) system for the Procurement module based on the CSV permissions matrix.## Overview * 
 * Centralized exports for the permissions system
 */

// Configuration
export {
  type RoleCode,
  type ModulePermission,
  type RolePermissions,
  ROLE_PERMISSIONS_MAP,
  getRolePermissions,
  hasModuleAccess,
  getModuleAccessLevel,
  hasSubModuleAccess,
  getAccessibleModules,
  canPerformAction,
} from './config/role-permissions';

// Procurement Permissions
export {
  PROCUREMENT_ACTIONS,
  PROCUREMENT_ROLE_PERMISSIONS,
  canPerformProcurementAction,
  getProcurementModuleAccess,
} from './config/procurement-permissions';

// Performance Management Permissions
export {
  PERFORMANCE_ACTIONS,
  PERFORMANCE_ROLE_PERMISSIONS,
  canPerformPerformanceAction,
  getPerformanceModuleAccess,
  isDepartmentHead,
} from './config/performance-permissions';

// Accounting Permissions
export {
  ACCOUNTING_ACTIONS,
  ACCOUNTING_ROLE_PERMISSIONS,
  canPerformAccountingAction,
  hasAccountingSubModuleAccess,
} from './config/accounting-permissions';

// Hooks
export {
  useRolePermissions,
  useHasPermission,
  useCanPerformAction,
  type UseRolePermissionsReturn,
} from './hooks/useRolePermissions';

export {
  useProcurementPermissions,
} from './hooks/useProcurementPermissions';

export {
  usePerformancePermissions,
  useHasPerformanceAccess,
} from './hooks/usePerformancePermissions';

export {
  useAccountingPermissions,
} from './hooks/useAccountingPermissions';

// Components
export {
  ModuleGuard,
  ActionGuard,
  RoleGuard,
  DepartmentGuard,
  LevelGuard,
  PermissionGuard,
} from '../components/permissions/PermissionGuards';
