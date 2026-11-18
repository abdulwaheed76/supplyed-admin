import type { DegreeCheck, DegreeCheckStatus } from "@/lib/degree-checks/schema"

const statusLabels: Record<DegreeCheckStatus, string> = {
  UNCONFIRMED: "Not confirmed by Hedd",
  WAITING: "With the university",
  MORE_INFORMATION: "More information wanted",
  VERIFIED: "Verified by the university",
  CANCELLED: "Cancelled",
}

/** Hedd's names for the fields a university can correct. */
const correctionLabels: Record<string, string> = {
  "first-names": "First names",
  "last-name": "Last name",
  "last-name-atos": "Last name at time of study",
  "date-of-birth": "Date of birth",
  "course-name": "Course",
  "classification-name": "Classification",
  "qualification-name": "Qualification",
  "year-of-award": "Year of award",
}

export function getDegreeCheckStatusLabel(status: DegreeCheckStatus) {
  return statusLabels[status]
}

export function getCorrectionLabel(field: string) {
  return correctionLabels[field] ?? field
}

/** A correction's value: '' means marked wrong with no value given, null means withheld. */
export function formatCorrectionValue(value: unknown) {
  if (value === null || value === undefined) return "Withheld by the university"
  if (value === "") return "Marked wrong, no value given"
  return String(value)
}

export function getDegreeCheckName(check: DegreeCheck) {
  return check.user.name?.trim() || check.user.email
}

/** "BSc Hons Mathematics, 2:1, 2015" from what the teacher entered. */
export function formatEnteredDegree(check: DegreeCheck) {
  return `${check.qualificationType} ${check.courseName}, ${check.classification}, ${check.yearOfAward}`
}

/** "BSc Hons Mathematics, 2:1, University of Leeds (2015)", as the university confirmed it. */
export function formatVerifiedDegree(degree: NonNullable<DegreeCheck["degree"]>) {
  const title = [degree.qualificationType, degree.courseName].filter(Boolean).join(" ")
  const parts = [title, degree.classification, degree.institutionName].filter(Boolean).join(", ")
  return degree.yearOfAward ? `${parts} (${degree.yearOfAward})` : parts
}

/** Date-only columns arrive as UTC midnight, so they are shown in UTC to keep the day. */
export function formatDegreeCheckDay(value?: string | null) {
  if (!value) return "—"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date)
}
