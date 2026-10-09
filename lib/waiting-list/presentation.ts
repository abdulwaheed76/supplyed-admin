import type {
  SubmissionStatus,
  SubmissionType,
} from "@/lib/waiting-list/schema"

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  CLOSED: "Closed",
}

export function getSubmissionStatusLabel(status: SubmissionStatus) {
  return STATUS_LABELS[status]
}

export function getSubmissionTypeLabel(type: SubmissionType) {
  return type === "SCHOOL" ? "School" : "Teacher"
}

export function formatSubmissionDate(
  value?: string | null,
  includeTime = false
) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } as const : {}),
  }).format(date)

  return includeTime ? `${formatted} UTC` : formatted
}
