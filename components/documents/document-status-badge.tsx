import { getDocumentStatusLabel } from "@/lib/documents/presentation"
import type { DocumentVerificationStatus } from "@/lib/documents/schema"
import { cn } from "@/lib/utils"

const statusClasses: Record<DocumentVerificationStatus, string> = {
  NOT_REQUIRED: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
  REQUIRES_INFO: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

export function DocumentStatusBadge({
  status,
}: {
  status: DocumentVerificationStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {getDocumentStatusLabel(status)}
    </span>
  )
}
