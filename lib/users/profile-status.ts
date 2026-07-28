export const PROFILE_STATUSES = [
  "INCOMPLETE",
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
  "REJECTED",
] as const

export type ProfileStatus = (typeof PROFILE_STATUSES)[number]

export const ADMIN_PROFILE_STATUS_TARGETS = PROFILE_STATUSES

export type AdminProfileStatus =
  (typeof ADMIN_PROFILE_STATUS_TARGETS)[number]

const profileStatusLabels: Record<ProfileStatus, string> = {
  INCOMPLETE: "Incomplete",
  PENDING: "Pending review",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DEACTIVATED: "Deactivated",
  REJECTED: "Rejected",
}

export function getAdminProfileStatusOptions() {
  return ADMIN_PROFILE_STATUS_TARGETS
}

export function getProfileStatusLabel(status: ProfileStatus) {
  return profileStatusLabels[status]
}
