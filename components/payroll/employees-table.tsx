"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { employeesApi, Employee } from "@/lib/api/payroll-api";
import {
  setApiEmployees,
  setEmployeesLoading,
  setEmployeesError,
} from "@/lib/store/slices/payrollSlice";
import { RichDataTable } from "@/components/payroll/rich-data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { EmployeeForm } from "./employee-form";
import { EmployeeDrawer } from "./employee-drawer";
import { CopyText } from "@/components/ui/copy-text";
import { useRolePermissions } from "@/lib/hooks/useRolePermissions";
import { PAYROLL_ACTIONS } from "@/lib/config/role-permissions";

interface EmployeesTableProps {
  title?: string;
  description?: string;
}

export function EmployeesTable({ title, description }: EmployeesTableProps) {
  const dispatch = useAppDispatch();
  const { apiEmployees, loading } = useAppSelector((state) => state.payroll);
  const { hasSpecificAction } = useRolePermissions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState("all");

  // Permission checks
  const canCreateEmployee = hasSpecificAction('payroll', PAYROLL_ACTIONS.CREATE_EMPLOYEE);
  const canUpdateEmployee = hasSpecificAction('payroll', PAYROLL_ACTIONS.UPDATE_EMPLOYEE);
  const canDeleteEmployee = hasSpecificAction('payroll', PAYROLL_ACTIONS.DELETE_EMPLOYEE);
  const canViewDetails = hasSpecificAction('payroll', PAYROLL_ACTIONS.VIEW_EMPLOYEE_DETAILS);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      dispatch(setEmployeesLoading(true));
      const response = await employeesApi.getAll();
      if (response.success && response.data) {
        dispatch(setApiEmployees(response.data));
      } else {
        dispatch(setEmployeesError("Failed to load employees"));
        toast.error("Failed to load employees");
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      dispatch(setEmployeesError("Failed to load employees"));
      toast.error("Failed to load employees");
    } finally {
      dispatch(setEmployeesLoading(false));
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleView = (employee: Employee) => {
    setViewingEmployee(employee);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (
      window.confirm(
        `Are you sure you want to delete employee ${employee.employeeNumber}?`
      )
    ) {
      try {
        await employeesApi.delete(employee.id);
        toast.success("Employee deleted successfully");
        loadEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        toast.error("Failed to delete employee");
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingEmployee) {
        await employeesApi.update(editingEmployee.id, data);
        toast.success("Employee updated successfully");
      } else {
        await employeesApi.create(data);
        toast.success("Employee created successfully");
      }
      setIsFormOpen(false);
      setEditingEmployee(null);
      loadEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      toast.error(
        editingEmployee
          ? "Failed to update employee"
          : "Failed to create employee"
      );
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setViewingEmployee(null);
  };

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    let filtered = apiEmployees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.employeeNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.user.firstName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.user.lastName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          employee.bankName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterBy !== "all") {
      filtered = filtered.filter((employee) =>
        filterBy === "active" ? employee.isActive : !employee.isActive
      );
    }

    return filtered;
  }, [apiEmployees, searchTerm, filterBy]);

  // Generate random gradient background for initials
  const getInitialsGradient = (name: string) => {
    const gradients = [
      "bg-gradient-to-br from-blue-500 to-blue-600",
      "bg-gradient-to-br from-green-500 to-green-600", 
      "bg-gradient-to-br from-purple-500 to-purple-600",
      "bg-gradient-to-br from-pink-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-indigo-600",
      "bg-gradient-to-br from-red-500 to-red-600",
      "bg-gradient-to-br from-yellow-500 to-yellow-600",
      "bg-gradient-to-br from-teal-500 to-teal-600",
      "bg-gradient-to-br from-orange-500 to-orange-600",
      "bg-gradient-to-br from-cyan-500 to-cyan-600"
    ]
    
    // Use name to consistently generate same gradient for same person
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return gradients[Math.abs(hash) % gradients.length]
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const columns = [
    {
      key: "user" as keyof Employee,
      label: "Name",
      sortable: true,
      render: (value: any) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${getInitialsGradient(`${value.firstName} ${value.lastName}`)}`}>
            {getInitials(value.firstName, value.lastName)}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {value.firstName} {value.lastName}
            </div>
            <CopyText 
              text={value.email}
              successMessage="Email copied to clipboard!"
              className="mt-1"
            />
          </div>
        </div>
      ),
    },
    {
      key: "employeeNumber" as keyof Employee,
      label: "Employee #",
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: "bankName" as keyof Employee,
      label: "Bank",
      sortable: true,
      render: (value: string) => (
        <span className="text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: "accountNumber" as keyof Employee,
      label: "Account Number",
      sortable: false,
      render: (value: string) => (
        <CopyText 
          text={value}
          successMessage="Account number copied to clipboard!"
        />
      ),
    },
    {
      key: "basicSalary" as keyof Employee,
      label: "Basic Salary",
      sortable: true,
      render: (value: string, row: Employee) => (
        <span className="text-sm text-gray-900">
          {row.currency.symbol}
          {parseFloat(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: "isActive" as keyof Employee,
      label: "Status",
      sortable: true,
      filterable: true,
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const filterOptions = [
    { value: "all", label: "All Employees" },
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-normal text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8" />
            {title || "Employee Management"}
          </h1>
          <p className="text-gray-600 mt-1">
            {description || "Manage employee information and payroll details"}
          </p>
        </div>
        {canCreateEmployee && (
          <Button
            onClick={handleCreate}
            variant="gradient-create"
            className="rounded-full h-10 px-6 shadow-sm font-normal"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Employee
          </Button>
        )}
      </div>

      {/* Data Table */}
      <RichDataTable
        data={filteredEmployees}
        columns={columns}
        loading={loading.employees}
        filterOptions={filterOptions}
        searchPlaceholder="Search employees..."
        title=""
        onView={canViewDetails ? handleView : undefined}
        onEdit={canUpdateEmployee ? handleEdit : undefined}
        onDelete={canDeleteEmployee ? handleDelete : undefined}
      />

      {/* Form Modal */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        editingEmployee={editingEmployee}
        loading={loading.employees}
      />

      {/* View Drawer */}
      <EmployeeDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        employee={viewingEmployee}
        onEdit={handleEdit}
        onTerminated={loadEmployees}
      />
    </div>
  );
}
