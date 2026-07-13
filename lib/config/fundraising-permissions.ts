/**
 * Fundraising & Investor Relations permissions — SRD roles mapped to RoleCode.
 *
 * - Head of Fundraising / BD → CFO, CEO, FUND_MGR, CIO
 * - IR Officer → MKT_MGR, FIN_MGR
 * - Compliance / Legal / Finance → SYSADMIN (config), FIN_OFF, ACCOUNTANT (read/write packs)
 * - Board / GP viewers → BOARD_CHAIR, BOARD_MEMBER
 */

export const FUNDRAISING_SUBMODULES_FULL = {
  'fr-dashboard': 'full',
  'fr-campaigns': 'full',
  'fr-investors': 'full',
  'fr-contacts': 'full',
  'fr-pipeline': 'full',
  'fr-mandates': 'full',
  'fr-due-diligence': 'full',
  'fr-data-rooms': 'full',
  'fr-communications': 'full',
  'fr-meetings': 'full',
  'fr-documents': 'full',
  'fr-agreements': 'full',
  'fr-commitments': 'full',
  'fr-onboarding': 'full',
  'fr-placement-agents': 'full',
  'fr-forecasts': 'full',
  'fr-reports': 'full',
  'fr-approvals': 'full',
  'fr-audit': 'full',
  'fr-settings': 'full',
} as const

export const FUNDRAISING_SUBMODULES_WRITE = {
  ...FUNDRAISING_SUBMODULES_FULL,
  'fr-settings': 'write',
  'fr-audit': 'read',
} as const

export const FUNDRAISING_SUBMODULES_READ = Object.fromEntries(
  Object.keys(FUNDRAISING_SUBMODULES_FULL).map((id) => [
    id,
    id === 'fr-settings' ? 'none' : 'read',
  ]),
) as Record<keyof typeof FUNDRAISING_SUBMODULES_FULL, 'read' | 'none'>

export const FUNDRAISING_ROLE_PERMISSIONS: Record<
  string,
  {
    access: 'full' | 'read' | 'write' | 'none'
    subModules: Record<string, 'full' | 'read' | 'write' | 'none'>
  }
> = {
  CEO: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },
  CFO: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },
  CIO: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },
  FUND_MGR: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },
  SYSADMIN: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },
  OPS_MGR: { access: 'full', subModules: { ...FUNDRAISING_SUBMODULES_FULL } },

  FIN_MGR: { access: 'write', subModules: { ...FUNDRAISING_SUBMODULES_WRITE } },
  MKT_MGR: { access: 'write', subModules: { ...FUNDRAISING_SUBMODULES_WRITE } },
  FIN_OFF: { access: 'write', subModules: { ...FUNDRAISING_SUBMODULES_WRITE } },
  ACCOUNTANT: { access: 'read', subModules: { ...FUNDRAISING_SUBMODULES_READ } },

  BOARD_CHAIR: { access: 'read', subModules: { ...FUNDRAISING_SUBMODULES_READ } },
  BOARD_MEMBER: { access: 'read', subModules: { ...FUNDRAISING_SUBMODULES_READ } },
}

/** ModulePermission fragment for role-permissions.ts */
export function fundraisingModulePermission(roleCode: string) {
  const pack = FUNDRAISING_ROLE_PERMISSIONS[roleCode]
  if (!pack) return null
  return {
    moduleId: 'fundraising' as const,
    access: pack.access,
    subModules: { ...pack.subModules },
  }
}
