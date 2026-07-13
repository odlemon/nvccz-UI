/**
 * Custom hook for role-based permissions
 * 
 * This hook provides utilities to check user permissions based on their role
 * from the auth state stored in Redux
 */

import { useMemo } from 'react';
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

  // Check if user is admin (has access to all modules)
  const isAdmin = useMemo(() => {
    if (!userDetails) return false;
    const roleName =
      typeof (userDetails as { role?: unknown }).role === "string"
        ? String((userDetails as { role: string }).role)
        : userDetails.role?.name;
    const code = userDetails.roleCode?.toLowerCase();
    return roleName?.toLowerCase() === "admin" || code === "admin";
  }, [userDetails]);

  // Extract role code from userDetails (fall back to login cookie user)
  const roleCode = useMemo(() => {
    const fromDetails = userDetails?.roleCode;
    const fromUser =
      user && typeof (user as { roleCode?: string }).roleCode === "string"
        ? (user as { roleCode?: string }).roleCode
        : null;
    const fromRoleObj =
      userDetails?.role &&
      typeof userDetails.role === "object" &&
      typeof (userDetails.role as { code?: string }).code === "string"
        ? (userDetails.role as { code?: string }).code
        : null;
    const code = fromDetails || fromRoleObj || fromUser || null;

    if (code && code.toLowerCase() !== "admin") {
      return code as RoleCode;
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

  // Get full permissions for the role
  const permissions = useMemo(() => {
    if (!roleCode) return null;
    return getRolePermissions(roleCode);
  }, [roleCode]);

  // Get accessible modules
  const accessibleModules = useMemo(() => {
    // Admin has access to all modules
    if (isAdmin) {
      const { MODULE_CONFIG } = require('@/lib/config/modules');
      return MODULE_CONFIG.map((m: any) => m.id);
    }
    if (!roleCode) return [];
    return getAccessibleModules(roleCode);
  }, [roleCode, isAdmin]);

  // Create permission checker functions
  const checkModuleAccess = useMemo(() => {
    return (moduleId: string): boolean => {
      // Admin has access to all modules
      if (isAdmin) return true;
      if (!roleCode) return false;
      return hasModuleAccess(roleCode, moduleId);
    };
  }, [roleCode, isAdmin]);

  const checkSubModuleAccess = useMemo(() => {
    return (moduleId: string, subModuleId: string): boolean => {
      // Admin has access to all sub-modules
      if (isAdmin) return true;
      if (!roleCode) return false;
      return hasSubModuleAccess(roleCode, moduleId, subModuleId);
    };
  }, [roleCode, isAdmin]);

  const getAccessLevel = useMemo(() => {
    return (moduleId: string): 'full' | 'read' | 'write' | 'none' => {
      // Admin has full access to everything
      if (isAdmin) return 'full';
      if (!roleCode) return 'none';
      return getModuleAccessLevel(roleCode, moduleId);
    };
  }, [roleCode, isAdmin]);

  const checkCanPerformAction = useMemo(() => {
    return (moduleId: string, action: 'create' | 'read' | 'update' | 'delete'): boolean => {
      // Admin can perform all actions
      if (isAdmin) return true;
      if (!roleCode) return false;
      const accessLevel = getModuleAccessLevel(roleCode, moduleId);
      return canPerformAction(accessLevel, action);
    };
  }, [roleCode, isAdmin]);

  const checkSpecificAction = useMemo(() => {
    return (moduleId: string, actionName: string): boolean => {
      // Admin can perform all actions
      if (isAdmin) return true;
      if (!roleCode || !permissions) return false;
      
      // Find the module in permissions
      const modulePermission = permissions.modules.find(m => m.moduleId === moduleId);
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
  }, [roleCode, isAdmin, permissions]);

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
      isFetchingDetails ||
      (isAuthenticated && !userDetails && !roleCode),
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
