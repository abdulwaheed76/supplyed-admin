import usage from "./usage.json"
const domains: Record<string, string[]> = {
  Teaching: ["subject", "skill", "keyStage", "coverType"],
  Locations: ["country", "city", "region", "timezone"],
  Onboarding: ["institutionType", "currency"],
  Waitlist: ["waitlistSchoolRole", "waitlistSchoolArea", "waitlistSchoolType", "supplyDaysPerTerm", "coverBookingMethod", "waitlistTeacherRole", "waitlistTeacherArea", "currentSupply", "daysPerWeek", "waitlistPhase", "foundingInterestStatus"],
  "Jobs & discovery": ["payType", "discoveryUrgency", "teacherRating", "applicationStatus", "jobStatus", "jobInvitationStatus"],
  "Bookings & billing": ["bookingInvoiceState", "refundReason", "bookingStatus", "invoiceStatus"],
  "Administration": ["profileStatus", "documentVerificationStatus", "signatoryApprovalStatus"],
  "Legacy forms": ["legacySchoolRole", "legacySchoolType", "legacySchoolTier", "legacyTeacherRole", "legacyTeacherPhase", "availability"],
  "Appearance & editors": ["proposalFontFamily", "proposalFontSize", "proposalTextColor", "descriptionFontSize", "themeAccent"],
}
// Reference metadata from the backend seed inventory, 19 October 2026.
// Domains describe product usage; they are not editable backend properties.
export function dropdownReference(name: string) {
  return { domain: Object.entries(domains).find(([, names]) => names.includes(name))?.[0] ?? "Other", ...(usage as Record<string, { controlIds: string[]; sources: string[] }>)[name] }
}
