import type { JobStatus } from "@/lib/jobs/schema"

const statusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  RESERVED: "Reserved",
  EXPIRED: "Expired",
  FILLED: "Filled",
  CLOSED: "Closed",
  SUSPENDED: "Suspended",
}

export function getJobStatusLabel(status: JobStatus) {
  return statusLabels[status]
}

export function formatJobDate(value?: string | null, includeTime = false) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(includeTime
      ? { hour: "2-digit" as const, minute: "2-digit" as const }
      : {}),
  }).format(date)
}

export function formatJobPay(
  amount?: number | null,
  payType?: string | null
) {
  if (amount == null) {
    return "—"
  }

  const formattedAmount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
  const normalizedType = payType?.trim().toLowerCase()
  const suffix =
    normalizedType === "hourly"
      ? " / hour"
      : normalizedType === "daily"
        ? " / day"
        : normalizedType === "fixed"
          ? " fixed"
          : normalizedType
            ? ` / ${normalizedType}`
            : ""

  return `${formattedAmount}${suffix}`
}

