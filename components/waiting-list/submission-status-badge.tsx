import { getSubmissionStatusLabel } from "@/lib/waiting-list/presentation"
import type { SubmissionStatus } from "@/lib/waiting-list/schema"
import { cn } from "@/lib/utils"

const statusClasses: Record<SubmissionStatus, string> = {
  NEW: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CONTACTED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  QUALIFIED: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  CONVERTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CLOSED: "bg-muted text-muted-foreground",
}

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {getSubmissionStatusLabel(status)}
    </span>
  )
}
