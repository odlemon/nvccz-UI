# Performance Management Permissions - Implementation Guide

## Status: ✅ READY FOR INTEGRATION

All Performance Management permissions are fully defined and ready to be applied to the performance module pages.

## Files Created

1. ✅ `lib/config/performance-permissions.ts` - All 50+ actions and 9 role mappings
2. ✅ `lib/hooks/usePerformancePermissions.ts` - React hook for easy integration
3. ✅ `lib/permissions.ts` - Updated with performance exports
4. ✅ `lib/config/role-permissions.ts` - Updated CEO, CFO, CIO, FIN_MGR, HR_MGR, HR_OFF with detailed performance permissions
5. ✅ `COMPLETE_PERMISSIONS_MAP.md` - Comprehensive documentation

## Quick Integration Guide

### Step 1: Apply Page-Level Guards

Follow the same pattern as Procurement module:

```typescript
'use client'

import { ModuleGuard, usePerformancePermissions } from '@/lib/permissions';
import { Loader2 } from 'lucide-react';

export default function PerformanceDashboardPage() {
  const { permissions, moduleAccess, isLoading } = usePerformancePermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ModuleGuard 
      moduleId="performance-management" 
      subModule="dashboard"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view the performance dashboard.
          </p>
        </div>
      }
    >
      <PerformanceLayout>
        {/* Your dashboard content */}
      </PerformanceLayout>
    </ModuleGuard>
  );
}
```

### Step 2: Apply Component-Level Permissions

Use permission flags for conditional rendering:

```typescript
export function PerformanceGoalsPage() {
  const { permissions, isLoading } = usePerformancePermissions();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {/* Company Goals - CEO Only */}
      {permissions.canCreateCompanyGoal && (
        <Button onClick={handleCreateCompanyGoal}>
          Create Company Goal
        </Button>
      )}

      {/* Department Goals - HODs Only */}
      {permissions.canCreateDepartmentGoal && (
        <Button onClick={handleCreateDepartmentGoal}>
          Create Department Goal
        </Button>
      )}

      {/* Individual Goals - Everyone */}
      {permissions.canCreateIndividualGoal && (
        <Button onClick={handleCreateIndividualGoal}>
          Create Personal Goal
        </Button>
      )}

      {/* Show department section only for HODs */}
      {permissions.isDepartmentHead && (
        <DepartmentPerformanceSection />
      )}
    </div>
  );
}
```

### Step 3: Filter Data Based on Permissions

```typescript
export function PerformanceTasksList() {
  const { permissions, roleCode } = usePerformancePermissions();
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    async function fetchTasks() {
      const params: any = {};
      
      // If user can only see own tasks
      if (!permissions.canViewAllTasks && !permissions.canViewDepartmentTasks) {
        params.userId = currentUser.id;
      }
      // If HOD, filter by department
      else if (permissions.isDepartmentHead && !permissions.canViewAllTasks) {
        params.department = currentUser.department;
      }
      // CEO, CFO, CIO, HR_MGR see all tasks
      
      const data = await fetchTasksAPI(params);
      setTasks(data);
    }
    
    fetchTasks();
  }, [permissions, roleCode]);

  return (
    <TasksTable 
      tasks={tasks}
      canUpdate={permissions.canUpdateOwnTask}
      canDelete={permissions.canDeleteOwnTask}
      canAssign={permissions.canAssignTask}
    />
  );
}
```

## Pages to Update

Based on your performance module structure, apply permissions to these pages:

1. **`app/performance/page.tsx`** - Performance Dashboard
   - Sub-module: `dashboard`
   - Permission: `permissions.canViewDashboard`

2. **`app/performance/kpi-management/page.tsx`** - KPI Management
   - Sub-module: `kpiManagement`
   - Permissions: `canCreateKPI`, `canUpdateKPI`, `canDeleteKPI`

3. **`app/performance/goals/page.tsx`** - Goals Management
   - Sub-module: `goalsManagement`
   - Permissions: `canCreateCompanyGoal`, `canCreateDepartmentGoal`, `canCreateIndividualGoal`

4. **`app/performance/tasks/page.tsx`** - Task Management
   - Sub-module: `taskManagement`
   - Permissions: `canCreateTask`, `canViewOwnTasks`, `canViewDepartmentTasks`, `canViewAllTasks`

5. **`app/performance/scorecards/page.tsx`** - Scorecards
   - Sub-module: `userScorecard`
   - Permissions: `canViewOwnScorecard`, `canViewDepartmentScorecard`, `canViewAllScorecards`

## Permission Flags Available

### Dashboard Permissions
- `canViewDashboard`
- `canViewAllDepartments`
- `canViewOwnDepartment`
- `canViewAllEmployees`
- `canViewOwnPerformance`

### KPI Permissions
- `canCreateKPI`
- `canViewKPI`
- `canUpdateKPI`
- `canDeleteKPI`
- `canAssignKPI`
- `canViewAllKPIs`
- `canViewDepartmentKPIs`

### Goals Permissions
- `canCreateCompanyGoal` (CEO only)
- `canCreateDepartmentGoal` (HODs)
- `canCreateIndividualGoal` (Everyone)
- `canViewCompanyGoals`
- `canViewDepartmentGoals`
- `canViewOwnDepartmentGoals` (HODs)
- `canViewIndividualGoals`
- `canViewOwnGoals` (Everyone)
- `canUpdateCompanyGoal`, `canUpdateDepartmentGoal`, `canUpdateOwnDepartmentGoal`, `canUpdateIndividualGoal`, `canUpdateOwnGoal`
- `canDeleteCompanyGoal`, `canDeleteDepartmentGoal`, `canDeleteOwnDepartmentGoal`, `canDeleteIndividualGoal`, `canDeleteOwnGoal`

### Task Permissions
- `canCreateTask` (Everyone)
- `canViewOwnTasks` (Everyone)
- `canViewDepartmentTasks` (HODs)
- `canViewAllTasks` (CEO, CFO, CIO, HR_MGR)
- `canUpdateOwnTask`, `canUpdateDepartmentTask`, `canUpdateAnyTask`
- `canDeleteOwnTask`, `canDeleteDepartmentTask`, `canDeleteAnyTask`
- `canAssignTask` (HODs, CEO, HR_MGR)

### Scorecard Permissions
- `canViewOwnScorecard` (Everyone)
- `canViewDepartmentScorecard` (HODs)
- `canViewAllScorecards` (CEO, CFO, CIO, HR_MGR)
- `canViewUserScorecards`
- `canUpdateScorecard` (HR_MGR only)

### Review Permissions
- `canConductPerformanceReview` (HODs, HR, CEO)
- `canViewPerformanceReviews` (HODs, HR, CEO)
- `canApprovePerformanceReview` (CEO, CFO, CIO, HR_MGR)

### Special Flag
- `isDepartmentHead` - Boolean flag to check if user is a HOD

## Module Access Levels

```typescript
const { moduleAccess } = usePerformancePermissions();

// Access levels: 'full' | 'read' | 'write' | 'none'
moduleAccess.dashboard          // Dashboard access level
moduleAccess.kpiManagement      // KPI Management access level
moduleAccess.goalsManagement    // Goals Management access level
moduleAccess.taskManagement     // Task Management access level
moduleAccess.departmentScorecard // Department Scorecard access level
moduleAccess.userScorecard      // User Scorecard access level
```

## Role Behavior Summary

### CEO, CFO, CIO
- **Full access** to all performance data
- Can manage company goals
- Can manage department goals
- See all departments and employees
- Can approve performance reviews

### HR Manager (HR_MGR)
- **Full access** to manage performance system
- Can create KPIs for all employees
- Can manage all goals
- Can update scorecards
- Can conduct and approve performance reviews

### Department Heads (HODs)
**Includes:** FIN_MGR, PROC_MGR, HR_MGR, OPS_MGR, IT_MGR, SALES_MGR, MKT_MGR, LEGAL_MGR

- **Department-scoped access**
- Can create and manage department goals (for their department only)
- Can view and manage department tasks
- Can view department scorecards
- Can conduct performance reviews for their team

### HR Officer (HR_OFF)
- Can assist with performance management
- Can create individual goals
- Can conduct performance reviews
- Cannot manage KPIs or company goals

### Investment Analyst (INV_ANALYST)
- Can create and manage own individual goals
- Can create and manage own tasks
- Can view own scorecard
- **Read-only** for dashboard

### Everyone (Default)
- Can create and manage **own** individual goals
- Can create and manage **own** tasks
- Can view **own** performance data and scorecard
- Cannot see other employees' data

## Department Head Detection

The system automatically detects if a user is a department head:

```typescript
const { permissions } = usePerformancePermissions();

if (permissions.isDepartmentHead) {
  // Show department management features
  // Filter data by user's department
  // Enable department-level actions
}
```

**HOD Roles:**
- FIN_MGR (Finance Manager)
- PROC_MGR (Procurement Manager)
- HR_MGR (HR Manager)
- MKT_MGR (Marketing Manager)
- IT_MGR (IT Manager)
- SALES_MGR (Sales Manager)
- OPS_MGR (Operations Manager)
- LEGAL_MGR (Legal Manager)

## Testing Checklist

- [ ] CEO can create company goals
- [ ] CFO has full access like CEO
- [ ] CIO has full access like CEO
- [ ] FIN_MGR can create department goals for Finance department only
- [ ] PROC_MGR can view only Procurement department tasks
- [ ] HR_MGR can manage all KPIs
- [ ] HR_OFF can conduct reviews but not approve
- [ ] INV_ANALYST can only see own goals and tasks
- [ ] Regular employees can only see own performance data
- [ ] Dashboard shows correct data based on role
- [ ] Department filters work for HODs
- [ ] Action buttons appear/hide based on permissions

## Next Steps

1. **Apply ModuleGuard** to all performance pages
2. **Add permission checks** to action buttons (create, edit, delete)
3. **Filter API calls** based on user role (own vs department vs all)
4. **Add loading states** during permission checks
5. **Test with different roles** (CEO, HOD, HR, regular employee)
6. **Update navigation** to hide inaccessible menu items

## Example: Complete Page Implementation

```typescript
'use client'

import { ModuleGuard, usePerformancePermissions } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function GoalsManagementPage() {
  const { permissions, isLoading } = usePerformancePermissions();
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    async function fetchGoals() {
      // Fetch goals based on permissions
      const params: any = {};
      
      if (permissions.canViewOwnGoals && !permissions.canViewIndividualGoals) {
        params.userId = currentUser.id;
      } else if (permissions.canViewOwnDepartmentGoals && !permissions.canViewDepartmentGoals) {
        params.department = currentUser.department;
      }
      
      const data = await fetchGoalsAPI(params);
      setGoals(data);
    }
    
    if (!isLoading) {
      fetchGoals();
    }
  }, [permissions, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ModuleGuard 
      moduleId="performance-management" 
      subModule="goalsManagement"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access goals management.
          </p>
        </div>
      }
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Goals Management</h1>
          
          <div className="flex gap-2">
            {permissions.canCreateCompanyGoal && (
              <Button onClick={() => setShowCompanyGoalDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Company Goal
              </Button>
            )}
            
            {permissions.canCreateDepartmentGoal && (
              <Button onClick={() => setShowDepartmentGoalDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Department Goal
              </Button>
            )}
            
            {permissions.canCreateIndividualGoal && (
              <Button onClick={() => setShowIndividualGoalDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Personal Goal
              </Button>
            )}
          </div>
        </div>

        <GoalsTable 
          goals={goals}
          canUpdate={permissions.canUpdateOwnGoal}
          canDelete={permissions.canDeleteOwnGoal}
        />
      </div>
    </ModuleGuard>
  );
}
```

## Summary

✅ **All permissions defined and ready**  
✅ **Hook created and tested**  
✅ **TypeScript errors resolved**  
✅ **Documentation complete**  
✅ **Integration pattern tested (Procurement)**  

You can now apply these permissions to your performance management pages using the exact same pattern that was successfully used for the Procurement module!
