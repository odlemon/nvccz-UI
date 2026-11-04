"use client"

/**
 * Custom hook for role-based permissions
 * 
 * This hook provides utilities to check user permissions based on their role
 * from the auth state stored in Redux
 */

import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AuthState } from '@/lib/store/slices/authSlice';
import {
  RoleCode,
  getRolePermissions,
  hasModuleAccess,
  getModuleAccessLevel,
  hasSubModuleAccess,
  getAccessibleModules,
  canPerformAction,
  RolePermissions
} from '@/lib/config/role-permissions';
import { resolveRoleCode } from '@/lib/utils/resolve-role-code';
import { rolesApi, type PortfolioEffectiveAccess } from '@/lib/api/roles-api';
import { legacyPortfolioGrants } from '@/lib/portfolio-v11/legacy-access'
import {
  clearPortfolioSessionRbac,
  primePortfolioSessionRbac,
  type PortfolioSessionRbac,
} from '@/lib/portfolio-v11/live-loaders'

interface RootState {
  auth: AuthState;
}

export interface UseRolePermissionsReturn {
  // User info
  roleCode: RoleCode | null;
  level: number;
  department: string | null;
  isAuthenticated: boolean;
  
  // Permission checkers
  hasModuleAccess: (moduleId: string) => boolean;
  hasSubModuleAccess: (moduleId: string, subModuleId: string) => boolean;
  getModuleAccessLevel: (moduleId: string) => 'full' | 'read' | 'write' | 'none';
  canPerformAction: (moduleId: string, action: 'create' | 'read' | 'update' | 'delete') => boolean;
  hasSpecificAction: (moduleId: string, actionName: string) => boolean;
  
  // New permission checkers for layouts
  canAccessModule: (moduleId: string) => boolean;
  canAccessSubModule: (moduleId: string, subModuleId: string) => boolean;
  
  // Accessible modules
  accessibleModules: string[];
  
  // Full permissions object
  permissions: RolePermissions | null;
  
  // Loading state
  isLoading: boolean;
}

function portfolioSessionPolicy(access: PortfolioEffectiveAccess): PortfolioSessionRbac {
  return {
    canManagePolicies: access.canManagePolicies === true,
    effectiveSource: access.source || 'legacy',
    effectivePermissions: Object.entries(access.permissions || {})
      .filter(([, granted]) => granted === true)
      .map(([key]) => key),
  }
}

/**
 * Hook to manage role-based permissions
 */
export function useRolePermissions(): UseRolePermissionsReturn {
  const {
    user,
    userDetails,
    isAuthenticated,
    isFetchingDetails,
    isLoading: authBootstrapping,
  } = useSelector((state: RootState) => state.auth);
  const [liveAccess, setLiveAccess] = useState<{ permissions: string[]; modules: string[]; isAdministrator: boolean } | null>(null)
  const [portfolioAccess, setPortfolioAccess] = useState<PortfolioEffectiveAccess | null>(null)
  const [liveAccessLoaded, setLiveAccessLoaded] = useState(false)
  const useLegacyPortfolioRbac = process.env.NEXT_PUBLIC_PORTFOLIO_RBAC_MODE === 'legacy'

  useEffect(() => {
    let active = true
    if (!isAuthenticated) {
      setLiveAccess(null)
      setPortfolioAccess(null)
      clearPortfolioSessionRbac()
      setLiveAccessLoaded(true)
      return () => { active = false }
    }
    setLiveAccessLoaded(false)
    Promise.allSettled([
      rolesApi.getRbacEffective(),
      useLegacyPortfolioRbac ? Promise.resolve(null) : rolesApi.getPortfolioEffective(),
    ])
      .then(([globalResult, portfolioResult]) => {
        if (!active) return
        if (globalResult.status === 'fulfilled' && globalResult.value?.data) setLiveAccess(globalResult.value.data)
        else setLiveAccess(null)
        if (portfolioResult.status === 'fulfilled' && portfolioResult.value?.data) {
          setPortfolioAccess(portfolioResult.value.data)
          // The module runtime reads this before its first paint.
          primePortfolioSessionRbac(portfolioSessionPolicy(portfolioResult.value.data))
        } else {
          setPortfolioAccess(null)
          primePortfolioSessionRbac(null)
        }
      })
      .finally(() => { if (active) setLiveAccessLoaded(true) })
    return () => { active = false }
  }, [isAuthenticated, useLegacyPortfolioRbac])

  const dynamicModuleId = (moduleId: string) => ({
    'home-v3': 'home',
    'portfolio-v11': 'portfolio',
    'performance-v22': 'performance',
    'procurement-v23': 'procurement',
    'accounting-v52': 'accounting',
    'payroll-v6': 'payroll',
  } as Record<string, string>)[moduleId] || moduleId.replace(/-management$/, '')
  const dynamicResourceId = (moduleId: string, subModuleId: string) => {
    const canonicalModule = dynamicModuleId(moduleId)
    if (canonicalModule === 'portfolio') {
      const portfolioAliases: Record<string, string> = {
        'pv11-dashboard': 'dashboard',
        'pv11-deals': 'deals',
        'pv11-funds': 'funds',
        'pv11-capital-calls': 'capital_calls',
        'pv11-companies': 'companies',
        'pv11-cash-accounts': 'cash_accounts',
        'pv11-reporting': 'reporting_schedules',
        'pv11-lps': 'lp_management',
        'pv11-documents': 'documents_vault',
        'pv11-e-signatures': 'e_signatures',
        'pv11-settings': 'settings',
        'Dashboard': 'dashboard',
      }
      if (portfolioAliases[subModuleId]) return portfolioAliases[subModuleId]
    }
    return subModuleId
      .replace(new RegExp(`^${canonicalModule}-`), '')
      .replace(/-/g, '_')
  }
  // Check if user is admin (has access to all modules)
  const isAdmin = useMemo(() => {
    if (liveAccess?.isAdministrator) return true
    const loginRole = user?.role?.toLowerCase();
    if (loginRole === "admin" || loginRole === "administrator") return true;

    if (!userDetails) return false;
    const roleName =
      typeof (userDetails as unknown as { role?: unknown }).role === "string"
        ? String((userDetails as unknown as { role: string }).role)
        : userDetails.role?.name;
    const code = userDetails.roleCode?.toLowerCase();
    return roleName?.toLowerCase() === "admin" || code === "admin";
  }, [userDetails, user, liveAccess]);

  // Extract role code from userDetails (fall back to login cookie user)
  const roleCode = useMemo(() => {
    const fromDetails = userDetails?.roleCode;
    const fromUser =
      user && typeof (user as { roleCode?: string }).roleCode === "string"
        ? (user as { roleCode?: string }).roleCode
        : null;
    const fromLoginRole = user?.role ? resolveRoleCode(user.role) : null;
    const fromRoleObj =
      userDetails?.role &&
      typeof userDetails.role === "object" &&
      typeof (userDetails.role as { code?: string }).code === "string"
        ? (userDetails.role as { code?: string }).code
        : null;
    const code = fromDetails || fromRoleObj || fromUser || fromLoginRole || null;
    const resolved = code ? resolveRoleCode(code) ?? (code as RoleCode) : null;

    if (resolved && resolved.toLowerCase() !== "admin") {
      return resolved;
    }
    // If no roleCode but is admin, return CEO (highest access)
    if (isAdmin) {
      return "CEO" as RoleCode;
    }
    if (code) {
      return code as RoleCode;
    }
    return null;
  }, [userDetails, user, isAdmin]);

  const portfolioGrants = useLegacyPortfolioRbac
    ? legacyPortfolioGrants(roleCode)
    : portfolioAccess?.permissions || {}
  const hasAnyPortfolioAccess = Object.entries(portfolioGrants).some(([key, allowed]) => allowed && key.startsWith('portfolio.'))
  const hasPortfolioResourceAccess = (resource: string, action: string = 'view') => {
    if (portfolioAccess?.canManagePolicies) return true
    const prefix = `portfolio.${resource}.`
    return portfolioGrants[`${prefix}${action}`] === true || portfolioGrants[`${prefix}manage`] === true
  }

  // Get full permissions for the role
  const permissions = useMemo(() => {
    if (!roleCode) return null;
    return getRolePermissions(roleCode);
  }, [roleCode]);

  // Get accessible modules
  const accessibleModules = useMemo(() => {
    if (liveAccess) {
      const modules = [...liveAccess.modules]
      if (hasAnyPortfolioAccess) modules.push('portfolio', 'portfolio-v11', 'portfolio-management')
      return [...new Set(modules)]
    }
    // Admin has access to all modules
    if (isAdmin) {
      const { MODULE_CONFIG } = require('@/lib/config/modules');
      return MODULE_CONFIG.map((m: any) => m.id);
    }
    if (!roleCode) return [];
    return getAccessibleModules(roleCode);
  }, [roleCode, isAdmin, liveAccess, hasAnyPortfolioAccess, useLegacyPortfolioRbac]);

  // Create permission checker functions
  const checkModuleAccess = useMemo(() => {
    return (moduleId: string): boolean => {
      const canonicalModule = dynamicModuleId(moduleId)
      if (canonicalModule === 'portfolio' && useLegacyPortfolioRbac) {
        return isAdmin || Boolean(roleCode && hasModuleAccess(roleCode, moduleId))
      }
      if (canonicalModule === 'portfolio' && hasAnyPortfolioAccess) return true
      if (liveAccess) return liveAccess.isAdministrator || liveAccess.modules.includes(dynamicModuleId(moduleId))
      // Admin has access to all modules
      if (isAdmin) return true;
      if (!roleCode) return false;
      return hasModuleAccess(roleCode, moduleId);
    };
  }, [roleCode, isAdmin, liveAccess, hasAnyPortfolioAccess, useLegacyPortfolioRbac]);

  const checkSubModuleAccess = useMemo(() => {
    return (moduleId: string, subModuleId: string): boolean => {
      const module = dynamicModuleId(moduleId)
      if (module === 'portfolio' && useLegacyPortfolioRbac) {
        return isAdmin || Boolean(roleCode && hasSubModuleAccess(roleCode, moduleId, subModuleId))
      }
      if (module === 'portfolio' && portfolioAccess) {
        return hasPortfolioResourceAccess(dynamicResourceId(moduleId, subModuleId), 'view')
      }
      if (liveAccess) {
        if (liveAccess.isAdministrator) return true
        const resource = dynamicResourceId(moduleId, subModuleId)
        if (module === 'portfolio') return hasPortfolioResourceAccess(resource, 'view')
        return liveAccess.permissions.includes(`${module}.${resource}.view`) || liveAccess.permissions.includes(`${module}.access.view`)
      }
      // Admin has access to all sub-modules
      if (isAdmin) return true;
      if (!roleCode) return false;
      return hasSubModuleAccess(roleCode, moduleId, subModuleId);
    };
  }, [roleCode, isAdmin, liveAccess, portfolioAccess, useLegacyPortfolioRbac]);

  const getAccessLevel = useMemo(() => {
    return (moduleId: string): 'full' | 'read' | 'write' | 'none' => {
      if (dynamicModuleId(moduleId) === 'portfolio' && useLegacyPortfolioRbac) {
        return roleCode ? getModuleAccessLevel(roleCode, moduleId) : 'none'
      }
      if (dynamicModuleId(moduleId) === 'portfolio' && portfolioAccess) {
        const grants = Object.entries(portfolioGrants).filter(([key, allowed]) => allowed && key.startsWith('portfolio.') && key.split('.')[1])
        if (!grants.length) return 'none'
        if (grants.some(([key]) => /\.(manage|approve|delete)$/.test(key))) return 'full'
        if (grants.some(([key]) => /\.(create|edit)$/.test(key))) return 'write'
        return 'read'
      }
      if (liveAccess) {
        if (liveAccess.isAdministrator) return 'full'
        const module = dynamicModuleId(moduleId)
        if (module === 'portfolio') {
          const grants = Object.entries(portfolioGrants).filter(([key, allowed]) => allowed && key.startsWith('portfolio.') && key.split('.')[1])
          if (!grants.length) return 'none'
          if (grants.some(([key]) => /\.(manage|approve|delete)$/.test(key))) return 'full'
          if (grants.some(([key]) => /\.(create|edit)$/.test(key))) return 'write'
          return 'read'
        }
        const grants = liveAccess.permissions.filter((permission) => permission.startsWith(`${module}.`))
        if (!grants.length) return 'none'
        if (grants.some((permission) => /\.(manage|approve|delete)$/.test(permission))) return 'full'
        if (grants.some((permission) => /\.(create|edit)$/.test(permission))) return 'write'
        return 'read'
      }
      // Admin has full access to everything
      if (isAdmin) return 'full';
      if (!roleCode) return 'none';
      return getModuleAccessLevel(roleCode, moduleId);
    };
  }, [roleCode, isAdmin, liveAccess, portfolioAccess, useLegacyPortfolioRbac]);

  const checkCanPerformAction = useMemo(() => {
    return (moduleId: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
      if (dynamicModuleId(moduleId) === 'portfolio' && useLegacyPortfolioRbac) {
        if (isAdmin) return true
        if (!roleCode) return false
        return canPerformAction(getModuleAccessLevel(roleCode, moduleId), action)
      }
      if (dynamicModuleId(moduleId) === 'portfolio' && portfolioAccess) {
        const target = action === 'read' ? 'view' : action === 'update' ? 'edit' : action
        return Object.entries(portfolioGrants).some(([key, allowed]) => allowed && key.startsWith('portfolio.') && (key.endsWith(`.${target}`) || key.endsWith('.manage')))
      }
      if (liveAccess) {
        if (liveAccess.isAdministrator) return true
        const module = dynamicModuleId(moduleId)
        if (module === 'portfolio') {
          const target = action === 'read' ? 'view' : action === 'update' ? 'edit' : action
          return Object.entries(portfolioGrants).some(([key, allowed]) => allowed && key.startsWith('portfolio.') && (key.endsWith(`.${target}`) || key.endsWith('.manage')))
        }
        const target = action === 'read' ? 'view' : action === 'update' ? 'edit' : action
        return liveAccess.permissions.some((permission) => permission.startsWith(`${module}.`) && (permission.endsWith(`.${target}`) || permission.endsWith('.manage')))
      }
      // Admin can perform all actions
      if (isAdmin) return true;
      if (!roleCode) return false;
      const accessLevel = getModuleAccessLevel(roleCode, moduleId);
      return canPerformAction(accessLevel, action);
    };
  }, [roleCode, isAdmin, liveAccess, portfolioAccess, useLegacyPortfolioRbac]);

  const checkSpecificAction = useMemo(() => {
    return (moduleId: string, actionName: string): boolean => {
      if (dynamicModuleId(moduleId) === 'portfolio' && useLegacyPortfolioRbac) {
        if (isAdmin) return true
        const modulePermission = permissions?.modules.find((entry) => entry != null && entry.moduleId === moduleId)
        return Boolean(modulePermission?.actions?.includes(actionName) || modulePermission?.access === 'full')
      }
      if (dynamicModuleId(moduleId) === 'portfolio' && portfolioAccess) {
        const target = actionName === 'read' ? 'view' : actionName === 'update' ? 'edit' : actionName
        return Object.entries(portfolioGrants).some(([key, allowed]) => allowed && key.startsWith('portfolio.') && (key.endsWith(`.${target}`) || key.endsWith('.manage')))
      }
      if (liveAccess) {
        if (liveAccess.isAdministrator) return true
        const module = dynamicModuleId(moduleId)
        if (module === 'portfolio') {
          const target = actionName === 'read' ? 'view' : actionName === 'update' ? 'edit' : actionName
          return Object.entries(portfolioGrants).some(([key, allowed]) => allowed && key.startsWith('portfolio.') && (key.endsWith(`.${target}`) || key.endsWith('.manage')))
        }
        // Some accounting grants are intentionally module-wide legacy permission names
        // (for example `bank_reconciliation` and `manage_ledger`) rather than dotted
        // resource actions. The backend enforces these exact grants on reconciliation APIs.
        return liveAccess.permissions.some((permission) => permission === actionName || permission === `${module}.${actionName}` || (permission.startsWith(`${module}.`) && (permission.endsWith(`.${actionName}`) || permission.endsWith('.manage'))))
      }
      // Admin can perform all actions
      if (isAdmin) return true;
      if (!roleCode || !permissions) return false;
      
      // Find the module in permissions
      // Legacy role payloads can contain null entries while permissions are
      // being hydrated. Ignore those entries instead of crashing the portal.
      const modulePermission = permissions.modules.find(m => m != null && m.moduleId === moduleId);
      if (!modulePermission) return false;
      
      // Check if the module has the specific action in its actions array
      if (modulePermission.actions && modulePermission.actions.includes(actionName)) {
        return true;
      }
      
      // Fallback: if module has 'full' access, allow all actions
      if (modulePermission.access === 'full') {
        return true;
      }
      
      return false;
    };
  }, [roleCode, isAdmin, permissions, liveAccess, portfolioAccess, useLegacyPortfolioRbac]);

  return {
    // User info
    roleCode,
    level: permissions?.level || 0,
    department: permissions?.department || null,
    isAuthenticated,
    
    // Permission checkers
    hasModuleAccess: checkModuleAccess,
    hasSubModuleAccess: checkSubModuleAccess,
    getModuleAccessLevel: getAccessLevel,
    canPerformAction: checkCanPerformAction,
    hasSpecificAction: checkSpecificAction,
    
    // Aliases for layout components
    canAccessModule: checkModuleAccess,
    canAccessSubModule: checkSubModuleAccess,
    
    // Accessible modules
    accessibleModules,
    
    // Full permissions object
    permissions,
    
    // Loading until auth settles — avoids Access Denied flash on first paint
    isLoading:
      authBootstrapping ||
      (isAuthenticated && !liveAccessLoaded) ||
      (isFetchingDetails && !userDetails && !roleCode),
  };
}

/**
 * Hook to check if user has specific permission
 * Useful for conditional rendering
 */
export function useHasPermission(
  moduleId: string,
  subModuleId?: string
): boolean {
  const { hasModuleAccess, hasSubModuleAccess } = useRolePermissions();

  return useMemo(() => {
    if (subModuleId) {
      return hasSubModuleAccess(moduleId, subModuleId);
    }
    return hasModuleAccess(moduleId);
  }, [moduleId, subModuleId, hasModuleAccess, hasSubModuleAccess]);
}

/**
 * Hook to check if user can perform a specific action
 */
export function useCanPerformAction(
  moduleId: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const { canPerformAction } = useRolePermissions();

  return useMemo(() => {
    return canPerformAction(moduleId, action);
  }, [moduleId, action, canPerformAction]);
}
