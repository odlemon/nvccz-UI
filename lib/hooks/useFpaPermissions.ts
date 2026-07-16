'use client'

import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import type { AuthState } from '@/lib/store/slices/authSlice'
import { useRolePermissions } from './useRolePermissions'
import {
  FPA_ACTIONS,
  canPerformFpaAction,
  getFpaModuleAccess,
  getFpaSubModuleAccess,
} from '@/lib/config/fpa-permissions'

interface RootState {
  auth: AuthState
}

/**
 * FP&A action + submodule permissions.
 * Literal `admin` role always returns true (full override).
 */
export function useFpaPermissions() {
  const { roleCode, hasModuleAccess, isLoading } = useRolePermissions()
  const userDetails = useSelector((s: RootState) => s.auth.userDetails)

  const isAdmin = useMemo(() => {
    if (!userDetails) return false
    const roleName =
      typeof (userDetails as { role?: unknown }).role === 'string'
        ? String((userDetails as { role: string }).role)
        : userDetails.role?.name
    const code = userDetails.roleCode?.toLowerCase()
    return roleName?.toLowerCase() === 'admin' || code === 'admin'
  }, [userDetails])

  const effectiveRole = isAdmin ? 'admin' : roleCode

  const can = useMemo(() => {
    return (action: string) => {
      if (isAdmin) return true
      return canPerformFpaAction(effectiveRole, action)
    }
  }, [isAdmin, effectiveRole])

  const hasFpaAccess = useMemo(() => {
    if (isAdmin) return true
    return hasModuleAccess('forecasting') || getFpaModuleAccess(roleCode) !== 'none'
  }, [isAdmin, hasModuleAccess, roleCode])

  const subAccess = useMemo(() => {
    return (subModuleId: string) => {
      if (isAdmin) return 'full' as const
      return getFpaSubModuleAccess(roleCode, subModuleId)
    }
  }, [isAdmin, roleCode])

  const permissions = useMemo(
    () => ({
      canViewHome: can(FPA_ACTIONS.VIEW_HOME),
      canViewAllEntities: can(FPA_ACTIONS.VIEW_ALL_ENTITIES),
      viewApprovedOnly: can(FPA_ACTIONS.VIEW_APPROVED_ONLY) && !can(FPA_ACTIONS.EDIT_GRID),

      canCreateModel: can(FPA_ACTIONS.CREATE_MODEL),
      canEditModel: can(FPA_ACTIONS.EDIT_MODEL),
      canConfigureBuilder: can(FPA_ACTIONS.CONFIGURE_BUILDER),

      canEditGrid: can(FPA_ACTIONS.EDIT_GRID) || can(FPA_ACTIONS.EDIT_OWN_DEPARTMENT),
      /** FP&A / admin — edit any department slice. */
      canEditAllDepartments: can(FPA_ACTIONS.EDIT_GRID),
      /** Department owner — only authorised department(s). */
      canEditOwnDepartment: can(FPA_ACTIONS.EDIT_OWN_DEPARTMENT),
      canConfigureDrivers: can(FPA_ACTIONS.CONFIGURE_DRIVERS),
      canCreateScenario: can(FPA_ACTIONS.CREATE_SCENARIO),
      canCompareScenarios: can(FPA_ACTIONS.COMPARE_SCENARIOS),

      canAssignTasks: can(FPA_ACTIONS.ASSIGN_TASKS),
      canSubmitTask: can(FPA_ACTIONS.SUBMIT_TASK),
      canReviewSubmissions: can(FPA_ACTIONS.REVIEW_SUBMISSIONS),
      canApproveBudget: can(FPA_ACTIONS.APPROVE_BUDGET),
      canReturnTask: can(FPA_ACTIONS.RETURN_TASK),
      canLockVersion: can(FPA_ACTIONS.LOCK_VERSION),

      canAddCommentary: can(FPA_ACTIONS.ADD_COMMENTARY),
      canInvestigateVariance: can(FPA_ACTIONS.INVESTIGATE_VARIANCE),
      canPrepareReports: can(FPA_ACTIONS.PREPARE_REPORTS),
      canExportBoardPack: can(FPA_ACTIONS.EXPORT_BOARD_PACK),
      canManageSettings: can(FPA_ACTIONS.MANAGE_SETTINGS),
    }),
    [can],
  )

  return {
    isLoading,
    isAdmin,
    roleCode: effectiveRole,
    hasFpaAccess,
    can,
    subAccess,
    ...permissions,
  }
}
