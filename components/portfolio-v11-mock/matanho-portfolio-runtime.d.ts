declare module "@/components/portfolio-v11-mock/matanho-portfolio-runtime" {
  export function startPortfolioV11Runtime(
    rootEl: HTMLElement,
    options?: {
      shellHtml?: string
      initialPage?: string
      /** Policy already resolved by the host; adopted before the first paint. */
      sessionRbac?: { canManagePolicies?: boolean; effectiveSource?: string; effectivePermissions?: string[] }
      /** When true (default), Matanho fixtures never paint — API / empty only. */
      liveOnly?: boolean
      currentUser?: { id?: string; email?: string; firstName?: string; lastName?: string; role?: string | { name?: string }; roleName?: string; roleCode?: string; roleId?: string } | null
      /** Enables clearly labeled in-memory synthetic document fixtures for local UAT only. */
      allowSyntheticFixtures?: boolean
      localUatFundId?: string
      managerLegalEntity?: string
      /** Controls whether the live fund creation action is rendered. */
      canCreateFund?: boolean | (() => boolean)
      canInviteLp?: boolean | (() => boolean)
      onRbacGrantsChanged?: (roleId: string, permissions: string[]) => Promise<unknown>
      onRbacRoleAssigned?: (userId: string, roleId: string) => Promise<unknown>
      onRbacAssignmentPeople?: () => Promise<Array<{ id: string; name?: string; email?: string; department?: string; departmentRole?: string; title?: string; roleName?: string; portfolioRoleId?: string }>>
      onRbacRoleCreated?: (input: { name: string; description?: string; cloneFromId?: string; permissions: Record<string, boolean> }) => Promise<{ id: string; name: string; description?: string | null; permissions?: string[]; draftVersion?: { version: number; permissions: Record<string, boolean> } | null }>
      onRbacConfigurationExported?: () => Promise<unknown>
      onRbacRecordDetail?: (input: { roleId: string; resource: string }) => Promise<any>
      onRbacRoleRefreshed?: (roleId: string) => Promise<any>
      onRbacRoleAudit?: (roleId: string) => Promise<any[]>
      onRbacRoleActivated?: (roleId: string, expectedRevision: number) => Promise<unknown>
      onRbacRoleDisabled?: (roleId: string, expectedRevision: number) => Promise<unknown>
      onRbacRoleRestored?: (roleId: string, expectedRevision: number) => Promise<unknown>
      onRbacPolicyPreview?: (roleId: string) => Promise<unknown>
      onRbacRoleDeleted?: (roleId: string) => Promise<{ id: string; name: string }>
      onNavigate?: (page: string) => void
      onCompaniesPage?: (filters: { page: number; limit: number; search?: string; industry?: string; fundId?: string; status?: string }) => Promise<{ rows: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>
      onCompanyDocumentUpload?: (input: { companyId: string; file: File; folder: string }) => Promise<unknown>
      onCompanyDocumentRequest?: (input: { companyId: string; title: string; folder: string; dueDate?: string }) => Promise<unknown>
    }
  ): {
    setPage: (page: string, detail?: Record<string, string>) => void
    destroy: () => void
    beginLiveLoad?: () => void
    failLiveLoad?: (message?: string) => void
    failRbacSettings?: (message?: string) => void
    hydrate?: (payload: unknown) => void
  }
}

/**
 * Single source of truth for the runtime's public JS bridge
 * (window.MatanhoPortfolioUI, set by matanho-portfolio-runtime.js).
 * Do not redeclare this in individual .ts/.tsx files — import nothing,
 * it applies ambiently once this file is part of the program.
 */
declare global {
  interface Window {
    /** Wired by portfolio-v11-app.tsx; the Portfolio runtime hands its export spec here. */
    __PORTFOLIO_EXPORT__?: (kind: "pdf" | "excel" | "csv", spec: unknown) => Promise<string>
    __APPLY_PORTAL_URL__?: string
    __INVESTEE_PORTAL_URL__?: string
    MatanhoPortfolioUI?: {
      hydrate: (payload: unknown) => void
      updateCapitalCall?: (call: unknown) => void
      beginLiveLoad?: () => void
      failLiveLoad?: (message?: string) => void
      getSnapshot?: () => { state?: { selectedDealId?: string; selectedLPId?: string; selectedCompanyId?: string; companyTab?: string; page?: string } }
      setDealDetail?: (detail: unknown) => void
      setDealDetailLoading?: (loading: boolean) => void
      setPageLoading?: (loading: boolean) => void
      setInvestmentUsers?: (users: unknown[]) => void
      openDdTaskModal?: (users?: unknown[]) => void
      openSignatureTemplatesModal?: (templates?: unknown[]) => void
      notify?: (title: string, body?: string, tone?: string) => void
      closeOverlays?: () => void
      setActionBusy?: (busy: boolean, message?: string, actionName?: string) => void
      setDealTab?: (tab: string) => void
      setCapitalCallPreview?: (data: unknown) => void
      showCapitalCallNotice?: (data: unknown) => void
      setCapitalCallPreview?: (data: unknown) => void
      showCapitalCallNotice?: (data: unknown) => void
    setFundDetailData?: (fundId: string, snapshots: unknown[], documents: unknown[], distributions: unknown[] | null) => void
      setCompanyDetail?: (detail: unknown) => void
      setCompanyDetailLoading?: (loading: boolean, error?: string) => void
      loadCompaniesPage?: (page?: number) => Promise<void>
      setFundPerformanceSnapshots?: (fundId: string, snapshots: unknown[]) => void
      setFundDocuments?: (fundId: string, documents: unknown[]) => void
      setFundDistributions?: (fundId: string, distributions: unknown[] | null) => void
    }
  }
}

export {}
