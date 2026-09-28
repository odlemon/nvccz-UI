/**
 * SRD §40: what each stored status is called on screen. Mirrors the server's map (nvccz
 * src/services/status/StatusTransitions.ts, served at GET /procurement/statuses); the UI suite compares the two so they cannot drift.
 *
 * A requisition under review is "Under Review" whoever it waits on; who that is comes from its approval route.
 * The purchase order statuses after "Issued" are the ones the system already used and are not confirmed against the SRD
 * (its list is cut off after "Draft, Pending Approval, Approved, Issued").
 */
export const REQUISITION_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING_APPROVAL: "Under Review",
  PENDING_VC_EXECUTIVE_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETURNED: "Returned",
  RFQ_SENT: "Converted to Sourcing",
  CONVERTED_TO_PO: "Converted to Sourcing",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
}

export const RFQ_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  PUBLISHED: "Published",
  OPEN: "Open",
  CLOSED: "Closed",
  UNDER_EVALUATION: "Under Evaluation",
  AWAITING_APPROVAL: "Awaiting Approval",
  AWARDED: "Awarded",
  CANCELLED: "Cancelled",
  COMPLETED: "Awarded",
}

export const PO_LABEL: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending Approval",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  SENT: "Issued",
  REJECTED: "Rejected",
  ACKNOWLEDGED: "Acknowledged",
  PARTIALLY_DELIVERED: "Partially delivered",
  PARTIALLY_RECEIVED: "Partially delivered",
  DELIVERED: "Delivered",
  RECEIVED: "Delivered",
  BILLED: "Billed",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
}
