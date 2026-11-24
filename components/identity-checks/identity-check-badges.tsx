import {
  getIdentityCheckDecisionLabel,
  getIdentityCheckOutcomeLabel,
  getIdentityCheckStatusLabel,
} from "@/lib/identity-checks/presentation"
import type {
  IdentityCheckDecision,
  IdentityCheckOutcome,
  IdentityCheckStatus,
} from "@/lib/identity-checks/schema"
import { cn } from "@/lib/utils"

const pill = "inline-flex rounded-full px-2 py-1 text-xs font-medium"

const statusClasses: Record<IdentityCheckStatus, string> = {
  LINK_SENT: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  SUBMITTED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  RESULTS_READY: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}

const outcomeClasses: Record<IdentityCheckOutcome, string> = {
  PASSED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REFERRED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  SOFT_FAILED: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  HARD_FAILED: "bg-destructive/10 text-destructive",
}

export function IdentityCheckStatusBadge({ status }: { status: IdentityCheckStatus }) {
  return <span className={cn(pill, statusClasses[status])}>{getIdentityCheckStatusLabel(status)}</span>
}

export function IdentityCheckOutcomeBadge({
  outcome,
}: {
  outcome?: IdentityCheckOutcome | null
}) {
  if (!outcome) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return <span className={cn(pill, outcomeClasses[outcome])}>{getIdentityCheckOutcomeLabel(outcome)}</span>
}

const decisionClasses: Record<IdentityCheckDecision, string> = {
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
}

/** Whether the check verifies the teacher, or that an admin still has to decide. */
export function IdentityCheckDecisionBadge({
  decision,
  needsDecision = false,
}: {
  decision?: IdentityCheckDecision | null
  needsDecision?: boolean
}) {
  if (needsDecision) {
    return <span className={cn(pill, "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>Needs decision</span>
  }

  if (!decision) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  return <span className={cn(pill, decisionClasses[decision])}>{getIdentityCheckDecisionLabel(decision)}</span>
}
