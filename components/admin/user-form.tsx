"use client"

import { useState, useEffect, useRef, useMemo, type ReactNode } from "react"
import { useForm, Controller } from "react-hook-form"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, AlertCircle, Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/store"
import { fetchDepartmentsWithRoles } from "@/lib/store/slices/adminSlice"
import { adminApiService, type UserMasterOptions } from "@/lib/api/admin-api"
import { STATUS_LABELS, humanize, toDateInput, formatDateTime } from "./user-master-shared"

interface UserFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  editingUser?: any | null
  loading?: boolean
}

const NONE = "__none__"

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  roleCode: "",
  departmentRole: "",
  status: "ACTIVE",
  employeeCode: "",
  mobileNumber: "",
  location: "",
  jobTitle: "",
  branch: "",
  businessUnit: "",
  costCentre: "",
  reportingManagerId: "",
  procurementFunction: "",
  accessProfile: "",
  approvalLevel: "",
  approvalLimitAmount: "",
  delegatedApproverId: "",
  sodRestrictions: [] as string[],
  ssoUsername: "",
  uatRole: "",
  effectiveDate: "",
  endDate: "",
}

type FormValues = typeof EMPTY_VALUES

function toFormValues(u: any): FormValues {
  const s = (v: unknown) => (v == null ? "" : String(v))
  return {
    firstName: s(u.firstName),
    lastName: s(u.lastName),
    email: s(u.email),
    department: s(u.department || u.userDepartment),
    roleCode: s(u.roleCode),
    departmentRole: s(u.departmentRole),
    status: s(u.status) || "ACTIVE",
    employeeCode: s(u.employeeCode),
    mobileNumber: s(u.mobileNumber),
    location: s(u.location),
    jobTitle: s(u.jobTitle),
    branch: s(u.branch),
    businessUnit: s(u.businessUnit),
    costCentre: s(u.costCentre),
    reportingManagerId: s(u.reportingManagerId),
    procurementFunction: s(u.procurementFunction),
    accessProfile: s(u.accessProfile),
    approvalLevel: s(u.approvalLevel),
    approvalLimitAmount: s(u.approvalLimitAmount),
    delegatedApproverId: s(u.delegatedApproverId),
    sodRestrictions: Array.isArray(u.sodRestrictions) ? u.sodRestrictions : [],
    ssoUsername: s(u.ssoUsername),
    uatRole: s(u.uatRole),
    effectiveDate: toDateInput(u.effectiveDate),
    endDate: toDateInput(u.endDate),
  }
}

/** Empty string -> null, so a cleared field is cleared on the server rather than left as it was. */
function toPayload(v: FormValues) {
  const text = (x: string) => (x.trim() === "" ? null : x.trim())
  const num = (x: string) => (x.trim() === "" ? null : Number(x))
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    department: v.department,
    roleCode: v.roleCode,
    departmentRole: v.departmentRole,
    status: v.status,
    employeeCode: text(v.employeeCode),
    mobileNumber: text(v.mobileNumber),
    location: text(v.location),
    jobTitle: text(v.jobTitle),
    branch: text(v.branch),
    businessUnit: text(v.businessUnit),
    costCentre: text(v.costCentre),
    reportingManagerId: text(v.reportingManagerId),
    procurementFunction: text(v.procurementFunction),
    accessProfile: text(v.accessProfile),
    approvalLevel: num(v.approvalLevel),
    approvalLimitAmount: num(v.approvalLimitAmount),
    delegatedApproverId: text(v.delegatedApproverId),
    sodRestrictions: v.sodRestrictions,
    ssoUsername: text(v.ssoUsername),
    uatRole: text(v.uatRole),
    effectiveDate: text(v.effectiveDate),
    endDate: text(v.endDate),
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-sm text-red-600 flex items-center gap-1">
      <AlertCircle className="w-4 h-4" />
      {message}
    </p>
  )
}

function Field({ label, error, hint, className, children }: { label: string; error?: string; hint?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      <FieldError message={error} />
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function UserFormBody({
  editingUser,
  onClose,
  onSubmit,
  loading,
  options,
  optionsError,
}: {
  editingUser?: any | null
  onClose: () => void
  onSubmit: (data: any) => void
  loading?: boolean
  options: UserMasterOptions | null
  optionsError: string | null
}) {
  const { departmentsWithRoles, users } = useAppSelector(state => state.admin)
  const [selectedDepartment, setSelectedDepartment] = useState(editingUser ? editingUser.department || editingUser.userDepartment || '' : '')
  // The body is mounted fresh for each user (see UserForm), so the defaults are the user's own values.
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    register,
    watch,
    getValues,
  } = useForm<FormValues>({ defaultValues: editingUser ? toFormValues(editingUser) : EMPTY_VALUES })

  const selectedDept = departmentsWithRoles.find(d => d.department === selectedDepartment)
  const departmentRoleOptions = ['HEAD', 'DEPUTY', 'OFFICER', 'MEMBER']

  const firstName = watch('firstName')
  const lastName = watch('lastName')
  const fullName = [firstName, lastName].map(s => (s || '').trim()).filter(Boolean).join(' ')

  const people = useMemo(
    () => users.filter(u => u.id !== editingUser?.id).sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)),
    [users, editingUser?.id]
  )
  const nameOf = (id?: string | null) => {
    const p = users.find(u => u.id === id)
    return p ? `${p.firstName} ${p.lastName}` : ''
  }
  const delegates = people.filter(u => String(u.status || 'ACTIVE').toUpperCase() === 'ACTIVE')

  const personSelect = (name: 'reportingManagerId' | 'delegatedApproverId', list: typeof people, placeholder: string) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select value={field.value || NONE} onValueChange={v => field.onChange(v === NONE ? '' : v)}>
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={NONE}>None</SelectItem>
            {list.map(u => (
              <SelectItem key={u.id} value={u.id}>
                {u.firstName} {u.lastName}{u.jobTitle ? ` — ${u.jobTitle}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )

  const optionSelect = (name: 'procurementFunction' | 'accessProfile' | 'status', values: string[], placeholder: string, allowNone: boolean) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          value={field.value || (allowNone ? NONE : undefined)}
          onValueChange={v => field.onChange(v === NONE ? '' : v)}
          disabled={!options}
        >
          <SelectTrigger className="rounded-full">
            <SelectValue placeholder={options ? placeholder : 'Loading…'} />
          </SelectTrigger>
          <SelectContent>
            {allowNone && <SelectItem value={NONE}>Not set</SelectItem>}
            {values.map(v => (
              <SelectItem key={v} value={v}>
                {name === 'status' ? STATUS_LABELS[v as keyof typeof STATUS_LABELS] || v : humanize(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  )

  return (
    <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {editingUser ? 'Edit User' : 'Create New User'}
          </DialogTitle>
          <DialogDescription>
            {editingUser ? 'Update the user master record' : 'Create a new user account with role, organisation and authority'}
          </DialogDescription>
        </DialogHeader>

        {optionsError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {optionsError}. Status, procurement function, access profile and segregation-of-duties options are unavailable.
          </p>
        )}

        <form
          onSubmit={handleSubmit(values => onSubmit(toPayload(values)))}
          className="space-y-8"
        >
          {/* Identity */}
          <Section title="Identity">
            <Field label="First Name *" error={errors.firstName?.message}>
              <Input {...register('firstName', { required: 'First name is required' })} placeholder="e.g., John" className="rounded-full" />
            </Field>
            <Field label="Surname *" error={errors.lastName?.message}>
              <Input {...register('lastName', { required: 'Surname is required' })} placeholder="e.g., Doe" className="rounded-full" />
            </Field>
            <Field label="Full Name" hint="Derived from first name and surname">
              <Input value={fullName} readOnly disabled className="rounded-full bg-gray-50" />
            </Field>
            <Field label="Employee / User ID" error={errors.employeeCode?.message} hint={editingUser ? undefined : 'Left blank, the next ID (EMP-#####) is assigned'}>
              <Input {...register('employeeCode')} placeholder="EMP-00001" className="rounded-full" />
            </Field>
            <Field label="Work Email *" error={errors.email?.message}>
              <Input
                {...register('email', {
                  required: 'Email is required',
                  pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                })}
                type="email"
                placeholder="e.g., john.doe@nvccz.co.zw"
                className="rounded-full"
              />
            </Field>
            <Field label="Mobile Number" error={errors.mobileNumber?.message}>
              <Input
                {...register('mobileNumber', {
                  pattern: { value: /^\+?[0-9][0-9 ()-]{5,30}$/, message: 'Enter a valid phone number, e.g. +263 77 123 4567' },
                })}
                placeholder="+263 77 123 4567"
                className="rounded-full"
              />
            </Field>
          </Section>

          {/* Organisation */}
          <Section title="Organisation">
            <Field label="Department *" error={errors.department?.message}>
              <Controller
                name="department"
                control={control}
                rules={{ required: 'Department is required' }}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedDepartment(value)
                      setValue('roleCode', '')
                    }}
                    value={field.value}
                  >
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select department..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsWithRoles.map((dept) => (
                        <SelectItem key={dept.departmentCode} value={dept.department}>
                          {dept.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Job Title" error={errors.jobTitle?.message}>
              <Input {...register('jobTitle')} placeholder="e.g., Senior Analyst" className="rounded-full" />
            </Field>
            <Field label="Business Unit">
              <Input {...register('businessUnit')} className="rounded-full" />
            </Field>
            <Field label="Branch">
              <Input {...register('branch')} className="rounded-full" />
            </Field>
            <Field label="Location">
              <Input {...register('location')} className="rounded-full" />
            </Field>
            <Field label="Cost Centre" hint="Defaults onto requisitions this user raises">
              <Input {...register('costCentre')} className="rounded-full" />
            </Field>
            <Field label="Reporting Manager" className="md:col-span-2" hint="Over-limit approvals escalate up this line">
              {personSelect('reportingManagerId', people, 'Select reporting manager…')}
            </Field>
          </Section>

          {/* Role & authority */}
          <Section title="Role & Authority" description="These fields change what the person can do in Procurement.">
            <Field label="System Role *" error={errors.roleCode?.message}>
              <Controller
                name="roleCode"
                control={control}
                rules={{ required: 'Role is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDepartment}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder={selectedDepartment ? "Select role..." : "Select department first..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedDept?.roles.map((role) => (
                        <SelectItem key={role.code} value={role.code}>
                          <div className="flex flex-col">
                            <span className="font-medium">{role.name}</span>
                            <span className="text-xs text-gray-500">{role.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Department Role *" error={errors.departmentRole?.message} hint="HEAD or DEPUTY can approve requisitions of the department">
              <Controller
                name="departmentRole"
                control={control}
                rules={{ required: 'Department role is required' }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select role level..." />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentRoleOptions.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="Procurement Function" hint="Limits which procurement areas the person can use">
              {optionSelect('procurementFunction', options?.procurementFunctions || [], 'Not set (role decides)', true)}
            </Field>
            <Field label="Access Profile" hint="Read only refuses every procurement write">
              {optionSelect('accessProfile', options?.accessProfiles || [], 'Standard', true)}
            </Field>
            <Field label="Approval Level" error={errors.approvalLevel?.message} hint="Routing steps can require a minimum level">
              <Input
                {...register('approvalLevel', {
                  validate: v => v === '' || (/^\d+$/.test(String(v)) && Number(v) <= 99) || 'Whole number from 0 to 99',
                })}
                inputMode="numeric"
                className="rounded-full"
              />
            </Field>
            <Field label="Approval Limit" error={errors.approvalLimitAmount?.message} hint="Blank means no limit. Above it, approvals are blocked and escalated">
              <Input
                {...register('approvalLimitAmount', {
                  validate: v => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0) || 'Enter zero or more',
                })}
                inputMode="decimal"
                className="rounded-full"
              />
            </Field>
            <Field label="Delegated Approver" className="md:col-span-2" hint="While set, this person's approvals are routed to the delegate">
              {personSelect('delegatedApproverId', delegates, 'Select delegate…')}
            </Field>
            <Field label="Segregation-of-Duties Restrictions" className="md:col-span-2" hint="Nobody can approve a record they raised, whatever is ticked here">
              <Controller
                name="sodRestrictions"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                    {!options && !optionsError && <p className="text-sm text-gray-500">Loading…</p>}
                    {(options?.sodRestrictions || []).map(r => {
                      const checked = (field.value || []).includes(r.code)
                      return (
                        <label key={r.code} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={e =>
                              field.onChange(e.target.checked ? [...(field.value || []), r.code] : (field.value || []).filter((c: string) => c !== r.code))
                            }
                          />
                          {r.label}
                        </label>
                      )
                    })}
                  </div>
                )}
              />
            </Field>
          </Section>

          {/* Access */}
          <Section title="Access">
            <Field label="Network / SSO Username" error={errors.ssoUsername?.message} hint="Can be used instead of the email to sign in">
              <Input
                {...register('ssoUsername', {
                  pattern: { value: /^[A-Za-z0-9._\\-]{2,128}$/, message: 'Letters, numbers, dot, dash, underscore and backslash only' },
                })}
                className="rounded-full"
              />
            </Field>
            <Field label="UAT Role">
              <Input {...register('uatRole')} className="rounded-full" />
            </Field>
            <Field label="User Status">
              {optionSelect('status', options?.statuses || ['ACTIVE'], 'Active', false)}
            </Field>
          </Section>

          {/* Validity */}
          <Section title="Validity" description="Outside this window the person cannot sign in or act.">
            <Field label="Effective Date">
              <Input type="date" {...register('effectiveDate')} className="rounded-full" />
            </Field>
            <Field label="End Date" error={errors.endDate?.message}>
              <Input
                type="date"
                {...register('endDate', {
                  validate: v => !v || !getValues('effectiveDate') || v >= getValues('effectiveDate') || 'End date cannot be before the effective date',
                })}
                className="rounded-full"
              />
            </Field>
          </Section>

          {editingUser && (
            <Section title="Audit">
              <Field label="Created">
                <p className="text-sm text-gray-600">
                  {formatDateTime(editingUser.createdAt) || '—'}{(editingUser.createdByName || nameOf(editingUser.createdById)) ? ` by ${editingUser.createdByName || nameOf(editingUser.createdById)}` : ''}
                </p>
              </Field>
              <Field label="Last Modified">
                <p className="text-sm text-gray-600">
                  {formatDateTime(editingUser.updatedAt) || '—'}{(editingUser.updatedByName || nameOf(editingUser.updatedById)) ? ` by ${editingUser.updatedByName || nameOf(editingUser.updatedById)}` : ''}
                </p>
              </Field>
              <Field label="Last Login">
                <p className="text-sm text-gray-600">{formatDateTime(editingUser.lastLoginAt) || 'Never'}</p>
              </Field>
            </Section>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingUser ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingUser ? 'Update User' : 'Create User'
              )}
            </Button>
          </div>
        </form>
    </>
  )
}

export function UserForm({ isOpen, onClose, onSubmit, editingUser, loading }: UserFormProps) {
  const dispatch = useAppDispatch()
  const departmentsCount = useAppSelector(state => state.admin.departmentsWithRoles.length)
  const [options, setOptions] = useState<UserMasterOptions | null>(null)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const optionsRequested = useRef(false)

  // Load departments and roles when form opens
  useEffect(() => {
    if (isOpen && departmentsCount === 0) {
      dispatch(fetchDepartmentsWithRoles())
    }
  }, [isOpen, departmentsCount, dispatch])

  // Option lists (statuses, procurement functions, access profiles, SoD restrictions) come from the API.
  useEffect(() => {
    if (!isOpen || options || optionsRequested.current) return
    optionsRequested.current = true
    adminApiService
      .getUserMasterOptions()
      .then(res => setOptions(res.data))
      .catch((e: any) => {
        optionsRequested.current = false
        setOptionsError(e?.message || 'Failed to load field options')
      })
  }, [isOpen, options])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-hidden overflow-y-auto rounded-2xl">
        <UserFormBody
          key={editingUser?.id ?? 'new'}
          editingUser={editingUser}
          onClose={onClose}
          onSubmit={onSubmit}
          loading={loading}
          options={options}
          optionsError={optionsError}
        />
      </DialogContent>
    </Dialog>
  )
}
