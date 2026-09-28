"use client"

import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import type { User } from "@/lib/api/admin-api"
import { formatDate, formatDateTime, formatMoney, humanize, statusLabel } from "./user-master-shared"

function Row({ label, children }: { label: string; children: ReactNode }) {
  const empty = children == null || children === ""
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-right ${empty ? "text-gray-400" : "text-gray-900"}`}>{empty ? "—" : children}</span>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-normal text-gray-900 mb-3">{title}</h3>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

/**
 * The SRD "User Master" record for one user: identity, organisation, authority, access, validity and audit.
 * Read-only; edits go through the user form.
 */
export function UserMasterDetails({ user }: { user: User }) {
  const sod = user.sodRestrictions || []
  return (
    <div className="space-y-4">
      <Card title="Identity">
        <Row label="Employee / User ID">{user.employeeCode}</Row>
        <Row label="Full name">{user.fullName || `${user.firstName} ${user.lastName}`}</Row>
        <Row label="Work email">{user.email}</Row>
        <Row label="Mobile number">{user.mobileNumber}</Row>
      </Card>

      <Card title="Organisation">
        <Row label="Department">{user.userDepartment}</Row>
        <Row label="Business unit">{user.businessUnit}</Row>
        <Row label="Branch">{user.branch}</Row>
        <Row label="Location">{user.location}</Row>
        <Row label="Cost centre">{user.costCentre}</Row>
        <Row label="Job title">{user.jobTitle}</Row>
        <Row label="Reporting manager">{user.reportingManagerName}</Row>
      </Card>

      <Card title="Role & authority">
        <Row label="System role">{user.role?.name}</Row>
        <Row label="Procurement function">{humanize(user.procurementFunction)}</Row>
        <Row label="Access profile">{humanize(user.accessProfile) || "Standard"}</Row>
        <Row label="Approval level">{user.approvalLevel != null ? String(user.approvalLevel) : ""}</Row>
        <Row label="Approval limit">{user.approvalLimitAmount != null ? formatMoney(user.approvalLimitAmount) : "No limit"}</Row>
        <Row label="Delegated approver">{user.delegatedApproverName}</Row>
        <Row label="Segregation-of-duties restrictions">
          {sod.length ? (
            <span className="flex flex-wrap justify-end gap-1">
              {sod.map(code => (
                <Badge key={code} variant="outline" className="bg-amber-50 text-amber-700">{humanize(code)}</Badge>
              ))}
            </span>
          ) : (
            ""
          )}
        </Row>
      </Card>

      <Card title="Access & validity">
        <Row label="Network / SSO username">{user.ssoUsername}</Row>
        <Row label="UAT role">{user.uatRole}</Row>
        <Row label="User status">{statusLabel(user.status)}</Row>
        <Row label="Effective date">{formatDate(user.effectiveDate)}</Row>
        <Row label="End date">{formatDate(user.endDate)}</Row>
        {user.deactivatedAt && <Row label="Deactivated">{formatDateTime(user.deactivatedAt)}</Row>}
      </Card>

      <Card title="Audit">
        <Row label="Last login">{formatDateTime(user.lastLoginAt) || "Never"}</Row>
        <Row label="Created">{formatDateTime(user.createdAt)}</Row>
        <Row label="Created by">{user.createdByName}</Row>
        <Row label="Last modified">{formatDateTime(user.updatedAt)}</Row>
        <Row label="Modified by">{user.updatedByName}</Row>
      </Card>
    </div>
  )
}
