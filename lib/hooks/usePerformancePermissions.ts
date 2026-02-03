/**
 * Performance Management Module Permissions Hook
 * 
 * This hook provides easy access to performance-related permissions
 * for the current user's role.
 */

import { useMemo } from 'react';
import { useRolePermissions } from './useRolePermissions';
import { 
  PERFORMANCE_ACTIONS, 
  canPerformPerformanceAction,
  getPerformanceModuleAccess,
  isDepartmentHead
} from '../config/performance-permissions';

export function usePerformancePermissions() {
  const { roleCode, hasModuleAccess, isLoading } = useRolePermissions();

  // Helper to check if user can perform specific action
  const canPerformAction = useMemo(
    () => (action: string) => canPerformPerformanceAction(roleCode || '', action),
    [roleCode]
  );

  // Module access levels
  const moduleAccess = useMemo(() => ({
    dashboard: getPerformanceModuleAccess(roleCode || '', 'dashboard'),
    kpiManagement: getPerformanceModuleAccess(roleCode || '', 'kpiManagement'),
    goalsManagement: getPerformanceModuleAccess(roleCode || '', 'goalsManagement'),
    taskManagement: getPerformanceModuleAccess(roleCode || '', 'taskManagement'),
    departmentScorecard: getPerformanceModuleAccess(roleCode || '', 'departmentScorecard'),
    userScorecard: getPerformanceModuleAccess(roleCode || '', 'userScorecard'),
  }), [roleCode]);

  // Specific permission flags for easy use in components
  const permissions = useMemo(() => ({
    // Dashboard Permissions
    canViewDashboard: canPerformAction(PERFORMANCE_ACTIONS.VIEW_DASHBOARD),
    canViewAllDepartments: canPerformAction(PERFORMANCE_ACTIONS.VIEW_ALL_DEPARTMENTS_PERFORMANCE),
    canViewOwnDepartment: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_PERFORMANCE),
    canViewAllEmployees: canPerformAction(PERFORMANCE_ACTIONS.VIEW_ALL_EMPLOYEES_PERFORMANCE),
    canViewOwnPerformance: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_PERFORMANCE),
    
    // KPI Permissions
    canCreateKPI: canPerformAction(PERFORMANCE_ACTIONS.CREATE_KPI),
    canViewKPI: canPerformAction(PERFORMANCE_ACTIONS.VIEW_KPI),
    canUpdateKPI: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_KPI),
    canDeleteKPI: canPerformAction(PERFORMANCE_ACTIONS.DELETE_KPI),
    canAssignKPI: canPerformAction(PERFORMANCE_ACTIONS.ASSIGN_KPI),
    canViewAllKPIs: canPerformAction(PERFORMANCE_ACTIONS.VIEW_ALL_KPIS),
    canViewDepartmentKPIs: canPerformAction(PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_KPIS),
    
    // Goals Management Permissions
    canCreateCompanyGoal: canPerformAction(PERFORMANCE_ACTIONS.CREATE_COMPANY_GOAL),
    canCreateDepartmentGoal: canPerformAction(PERFORMANCE_ACTIONS.CREATE_DEPARTMENT_GOAL),
    canCreateIndividualGoal: canPerformAction(PERFORMANCE_ACTIONS.CREATE_INDIVIDUAL_GOAL),
    canViewCompanyGoals: canPerformAction(PERFORMANCE_ACTIONS.VIEW_COMPANY_GOALS),
    canViewDepartmentGoals: canPerformAction(PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_GOALS),
    canViewOwnDepartmentGoals: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_DEPARTMENT_GOALS),
    canViewIndividualGoals: canPerformAction(PERFORMANCE_ACTIONS.VIEW_INDIVIDUAL_GOALS),
    canViewOwnGoals: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_GOALS),
    canUpdateCompanyGoal: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_COMPANY_GOAL),
    canUpdateDepartmentGoal: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_GOAL),
    canUpdateOwnDepartmentGoal: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_OWN_DEPARTMENT_GOAL),
    canUpdateIndividualGoal: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_INDIVIDUAL_GOAL),
    canUpdateOwnGoal: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_OWN_GOAL),
    canDeleteCompanyGoal: canPerformAction(PERFORMANCE_ACTIONS.DELETE_COMPANY_GOAL),
    canDeleteDepartmentGoal: canPerformAction(PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_GOAL),
    canDeleteOwnDepartmentGoal: canPerformAction(PERFORMANCE_ACTIONS.DELETE_OWN_DEPARTMENT_GOAL),
    canDeleteIndividualGoal: canPerformAction(PERFORMANCE_ACTIONS.DELETE_INDIVIDUAL_GOAL),
    canDeleteOwnGoal: canPerformAction(PERFORMANCE_ACTIONS.DELETE_OWN_GOAL),
    
    // Task Management Permissions
    canCreateTask: canPerformAction(PERFORMANCE_ACTIONS.CREATE_TASK),
    canViewOwnTasks: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_TASKS),
    canViewDepartmentTasks: canPerformAction(PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_TASKS),
    canViewAllTasks: canPerformAction(PERFORMANCE_ACTIONS.VIEW_ALL_TASKS),
    canUpdateOwnTask: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_OWN_TASK),
    canUpdateDepartmentTask: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_DEPARTMENT_TASK),
    canUpdateAnyTask: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_ANY_TASK),
    canDeleteOwnTask: canPerformAction(PERFORMANCE_ACTIONS.DELETE_OWN_TASK),
    canDeleteDepartmentTask: canPerformAction(PERFORMANCE_ACTIONS.DELETE_DEPARTMENT_TASK),
    canDeleteAnyTask: canPerformAction(PERFORMANCE_ACTIONS.DELETE_ANY_TASK),
    canAssignTask: canPerformAction(PERFORMANCE_ACTIONS.ASSIGN_TASK),
    
    // Scorecard Permissions
    canViewOwnScorecard: canPerformAction(PERFORMANCE_ACTIONS.VIEW_OWN_SCORECARD),
    canViewDepartmentScorecard: canPerformAction(PERFORMANCE_ACTIONS.VIEW_DEPARTMENT_SCORECARD),
    canViewAllScorecards: canPerformAction(PERFORMANCE_ACTIONS.VIEW_ALL_SCORECARDS),
    canViewUserScorecards: canPerformAction(PERFORMANCE_ACTIONS.VIEW_USER_SCORECARDS),
    canUpdateScorecard: canPerformAction(PERFORMANCE_ACTIONS.UPDATE_SCORECARD),
    
    // Review & Evaluation Permissions
    canConductPerformanceReview: canPerformAction(PERFORMANCE_ACTIONS.CONDUCT_PERFORMANCE_REVIEW),
    canViewPerformanceReviews: canPerformAction(PERFORMANCE_ACTIONS.VIEW_PERFORMANCE_REVIEWS),
    canApprovePerformanceReview: canPerformAction(PERFORMANCE_ACTIONS.APPROVE_PERFORMANCE_REVIEW),
    
    // Special role checks
    isDepartmentHead: isDepartmentHead(roleCode || ''),
  }), [canPerformAction, roleCode]);

  return {
    roleCode,
    permissions,
    moduleAccess,
    canPerformAction,
    isLoading,
    hasModuleAccess: hasModuleAccess('performance-management'),
  };
}

/**
 * Simplified hook for checking if user has basic performance module access
 */
export function useHasPerformanceAccess() {
  const { hasModuleAccess } = usePerformancePermissions();
  return hasModuleAccess;
}
