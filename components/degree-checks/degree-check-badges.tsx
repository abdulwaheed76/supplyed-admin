import { getDegreeCheckStatusLabel } from "@/lib/degree-checks/presentation"
import type { DegreeCheck } from "@/lib/degree-checks/schema"
import { cn } from "@/lib/utils"

const pill = "inline-flex rounded-full px-2 py-1 text-xs font-medium"

/** The decision when there is one, otherwise where Hedd has it; needs-action checks stand out. */
export function DegreeCheckStatusBadge({ check }: { check: Pick<DegreeCheck, "status" | "decision" | "needsAction"> }) {
  if (check.decision === "APPROVED") {
    return <span className={cn(pill, "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400")}>Degree verified</span>
  }

  if (check.decision === "REJECTED") {
    return <span className={cn(pill, "bg-destructive/10 text-destructive")}>Degree rejected</span>
  }

  const tone = check.needsAction
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
    : check.status === "CANCELLED"
      ? "bg-muted text-muted-foreground"
      : "bg-sky-500/10 text-sky-700 dark:text-sky-400"

  return <span className={cn(pill, tone)}>{getDegreeCheckStatusLabel(check.status)}</span>
}

export function NeedsActionBadge() {
  return <span className={cn(pill, "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>Needs action</span>
}
