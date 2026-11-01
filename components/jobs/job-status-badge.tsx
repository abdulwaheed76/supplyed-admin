import { getJobStatusLabel } from "@/lib/jobs/presentation"
import type { JobStatus } from "@/lib/jobs/schema"
import { cn } from "@/lib/utils"

const statusClasses: Record<JobStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  RESERVED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  EXPIRED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  FILLED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  CLOSED: "bg-destructive/10 text-destructive",
  SUSPENDED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {getJobStatusLabel(status)}
    </span>
  )
}

