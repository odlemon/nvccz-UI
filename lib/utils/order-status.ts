import { isSkippedInternal, type RoutingHop } from "@/lib/api/investments-api"

/**
 * Derived settlement / accounting / confirmation status labels for a Trade,
 * computed purely from its routingHops. These are display-only conveniences
 * layered on top of the real RoutingHop.status enum — they do not exist as
 * fields on the Trade or RoutingHop API types.
 *
 * NOTE — SRD lifecycle mapping gap:
 * The SRD describes a richer trade lifecycle than what the real backend
 * currently exposes: Draft → Submitted → Compliance Review → Approved →
 * Sent to Broker → Partially Executed → Executed → Pending Settlement →
 * Settled (alt. Cancelled / Rejected / Failed / Archived). The real
 * `Trade.status` enum only has DRAFT/EXECUTED/ROUTING/SETTLED/
 * SETTLEMENT_FAILED/CANCELLED. "Compliance Review" and "Partially Executed"
 * in particular have no backing data source this phase — any lifecycle
 * stepper that visualizes the full SRD flow should render those two stages
 * as reserved/empty-with-a-note, not fabricate fake data to populate them.
 */

function findHop(hops: RoutingHop[] | undefined, target: RoutingHop["target"]): RoutingHop | undefined {
  return hops?.find((h) => h.target === target)
}

/** Settlement status, derived from the CUSTODIAN routing hop. */
export function settlementStatus(hops: RoutingHop[] | undefined): string {
  const hop = findHop(hops, "CUSTODIAN")
  if (!hop || isSkippedInternal(hop)) return "SETTLED" // no external custodian leg → settled internally
  switch (hop.status) {
    case "STAGED":
    case "DISPATCHED":
      return "PENDING"
    case "CONFIRMED":
      return "SETTLED"
    case "RETRYING":
      return "RETRYING"
    case "FAILED":
      return "FAILED"
    default:
      return "PENDING"
  }
}

/** Accounting (GL posting) status, derived from the ACCOUNTING_GL routing hop. */
export function accountingStatus(hops: RoutingHop[] | undefined): string {
  const hop = findHop(hops, "ACCOUNTING_GL")
  if (!hop) return "N/A"
  if (isSkippedInternal(hop)) return "POSTED"
  switch (hop.status) {
    case "STAGED":
    case "DISPATCHED":
      return "PENDING"
    case "CONFIRMED":
      return "POSTED"
    case "RETRYING":
      return "RETRYING"
    case "FAILED":
      return "FAILED"
    default:
      return "PENDING"
  }
}

/** Broker confirmation status, derived from the BROKER routing hop. */
export function confirmationStatus(hops: RoutingHop[] | undefined): string {
  const hop = findHop(hops, "BROKER")
  if (!hop) return "N/A"
  if (isSkippedInternal(hop)) return "CONFIRMED"
  switch (hop.status) {
    case "STAGED":
    case "DISPATCHED":
      return "PENDING"
    case "CONFIRMED":
      return "CONFIRMED"
    case "RETRYING":
      return "RETRYING"
    case "FAILED":
      return "FAILED"
    default:
      return "PENDING"
  }
}
