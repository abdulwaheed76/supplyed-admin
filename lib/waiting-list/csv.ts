import type { WaitingListSubmission } from "@/lib/waiting-list/schema"

const columns: Array<{
  heading: string
  value: (submission: WaitingListSubmission) => string | null | undefined
}> = [
  { heading: "Submission ID", value: (submission) => submission.id },
  { heading: "Type", value: (submission) => submission.type },
  { heading: "Status", value: (submission) => submission.status },
  { heading: "Name", value: (submission) => submission.name },
  { heading: "Email", value: (submission) => submission.email },
  { heading: "Phone", value: (submission) => submission.phone },
  { heading: "Role", value: (submission) => submission.role },
  {
    heading: "Organisation name",
    value: (submission) => submission.organizationName,
  },
  { heading: "Area", value: (submission) => submission.area },
  { heading: "Postcode", value: (submission) => submission.postcode },
  {
    heading: "Supply days per term",
    value: (submission) => submission.supplyDaysPerTerm,
  },
  {
    heading: "Current cover booking",
    value: (submission) => submission.coverBookingMethod,
  },
  {
    heading: "Founding programme interest",
    value: (submission) =>
      submission.foundingProgrammeInterest == null
        ? ""
        : submission.foundingProgrammeInterest
          ? "Yes"
          : "No",
  },
  {
    heading: "Current supply work",
    value: (submission) => submission.currentSupply,
  },
  {
    heading: "Days wanted per week",
    value: (submission) => submission.daysPerWeek,
  },
  {
    heading: "Launch email consent",
    value: (submission) =>
      submission.emailConsent == null
        ? ""
        : submission.emailConsent
          ? "Yes"
          : "No",
  },
  {
    heading: "Teaching phases",
    value: (submission) => submission.phases.join(", "),
  },
  { heading: "Main subject", value: (submission) => submission.mainSubject },
  { heading: "School type", value: (submission) => submission.schoolType },
  { heading: "Tier", value: (submission) => submission.tier },
  { heading: "Phase", value: (submission) => submission.phase },
  {
    heading: "Availability",
    value: (submission) => submission.availability,
  },
  { heading: "Message", value: (submission) => submission.message },
  { heading: "Source", value: (submission) => submission.source },
  { heading: "Campaign", value: (submission) => submission.campaign },
  { heading: "Created at", value: (submission) => submission.createdAt },
  { heading: "Updated at", value: (submission) => submission.updatedAt },
]

function csvCell(value: string | null | undefined) {
  let text = value ?? ""

  // Quoting is not enough to stop spreadsheet applications from interpreting
  // user-entered values as formulas. The apostrophe keeps the visible value.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`
  }

  return `"${text.replaceAll('"', '""')}"`
}

export function createWaitingListCsv(submissions: WaitingListSubmission[]) {
  const rows = [
    columns.map((column) => csvCell(column.heading)).join(","),
    ...submissions.map((submission) =>
      columns.map((column) => csvCell(column.value(submission))).join(","),
    ),
  ]

  // A UTF-8 BOM lets Excel open names and messages containing non-ASCII text
  // without asking the admin to choose an encoding.
  return `\uFEFF${rows.join("\r\n")}`
}
