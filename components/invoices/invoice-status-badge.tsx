import { getInvoiceStatusLabel } from "@/lib/invoices/presentation"
import type { InvoiceStatus } from "@/lib/invoices/schema"
import { cn } from "@/lib/utils"

const statusClasses: Record<InvoiceStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  OPEN: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  VOID: "bg-muted text-muted-foreground",
  UNCOLLECTIBLE: "bg-destructive/10 text-destructive",
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={cn("inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium", statusClasses[status])}>
      {getInvoiceStatusLabel(status)}
    </span>
  )
}
