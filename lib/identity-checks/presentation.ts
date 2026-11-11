import type {
  IdentityCheck,
  IdentityCheckDecision,
  IdentityCheckOutcome,
  IdentityCheckStatus,
} from "@/lib/identity-checks/schema"

const statusLabels: Record<IdentityCheckStatus, string> = {
  LINK_SENT: "Link sent",
  SUBMITTED: "Submitted",
  RESULTS_READY: "Fetching results",
  COMPLETED: "Completed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
}

const outcomeLabels: Record<IdentityCheckOutcome, string> = {
  PASSED: "Passed",
  REFERRED: "Referred",
  SOFT_FAILED: "Could not validate",
  HARD_FAILED: "Failed",
}

/** What each outcome asks of an admin, shown on the detail page. */
const outcomeGuidance: Record<IdentityCheckOutcome, string> = {
  PASSED: "TrustID confirmed identity and right to work. The teacher was verified automatically.",
  REFERRED:
    "TrustID finished the check but it is not a clean pass (work restrictions, an unsure face match or a rejected share code). Review the report, then approve or reject the teacher's identity.",
  SOFT_FAILED:
    "The document could not be validated, usually a blurry photo or a failed liveness check. Another attempt may succeed: send the teacher a new link, or approve or reject it from the report.",
  HARD_FAILED:
    "TrustID believes the document is fraudulent or the selfie is not the holder. The check was rejected automatically. TrustID advises ending the process and not telling the teacher why.",
}

const decisionLabels: Record<IdentityCheckDecision, string> = {
  APPROVED: "Identity approved",
  REJECTED: "Identity rejected",
}

const documentStatusLabels: Record<number, string> = {
  0: "No status",
  1: "Accepted",
  2: "Referred",
  3: "Failed (suspected fraud)",
  4: "Rejected (poor image)",
  5: "Could not validate",
}

const dbsStateLabels: Record<number, string> = {
  1: "ID check not passed",
  3: "ID and address passed",
  4: "ID passed, address not",
}

export function getIdentityCheckStatusLabel(status: IdentityCheckStatus) {
  return statusLabels[status]
}

export function getIdentityCheckOutcomeLabel(outcome: IdentityCheckOutcome) {
  return outcomeLabels[outcome]
}

export function getIdentityCheckOutcomeGuidance(outcome: IdentityCheckOutcome) {
  return outcomeGuidance[outcome]
}

export function getIdentityCheckDecisionLabel(decision: IdentityCheckDecision) {
  return decisionLabels[decision]
}

/** Who decided and when: an admin, or TrustID's result on its own. */
export function describeIdentityCheckDecision(check: IdentityCheck) {
  const when = formatIdentityCheckDate(check.decidedAt, true)

  return check.decidedBy
    ? `By ${check.decidedBy.name || check.decidedBy.email} on ${when}.`
    : `Automatically from TrustID's result on ${when}.`
}

export function getIdentityCheckName(check: IdentityCheck) {
  return check.user.name?.trim() || check.user.email
}

export function formatDocumentAuditorStatus(value?: number | null) {
  return value === null || value === undefined ? "—" : (documentStatusLabels[value] ?? String(value))
}

export function formatDbsInitiationState(value?: number | null) {
  return value === null || value === undefined ? "—" : (dbsStateLabels[value] ?? String(value))
}

export function formatYesNo(value?: boolean | null) {
  return value === null || value === undefined ? "—" : value ? "Yes" : "No"
}

export function formatEnumLabel(value?: string | null) {
  if (!value) return "—"
  const text = value.replaceAll("_", " ").toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatIdentityCheckDate(value?: string | null, includeTime = false) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" } : {}),
  }).format(date)
}

/** Reissuing is not possible while TrustID is still working on a submitted check. */
export function canReissueIdentityCheck(check: IdentityCheck) {
  return check.status !== "SUBMITTED" && check.status !== "RESULTS_READY"
}

/** Only a check stuck waiting for its results can have retrieval retried. */
export function canRetryIdentityCheckRetrieval(check: IdentityCheck) {
  return check.status === "RESULTS_READY" && Boolean(check.retrievalError)
}
