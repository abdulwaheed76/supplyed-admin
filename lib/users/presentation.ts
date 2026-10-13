import type { UserListItem } from "@/lib/users/schema"

export function formatUserRole(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function formatUserDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function formatUserDateTime(value?: string | null) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not recorded"
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date) + " UTC"
}

export function getUserProvidedName(user: UserListItem) {
  return user.name?.trim() || user.fullName?.trim() || user.displayName?.trim()
}

export function getUserDisplayName(user: UserListItem) {
  return getUserProvidedName(user) || user.email.split("@")[0]
}

export function getUserInitials(user: UserListItem) {
  return getUserDisplayName(user)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}
