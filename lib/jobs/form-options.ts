import type { DropdownDetail } from "@/lib/dropdowns/schema"

export const JOB_DROPDOWNS = ["subject", "city", "region", "keyStage", "payType"] as const
export type JobFormOptions = Record<(typeof JOB_DROPDOWNS)[number], Array<{ value: string; label: string }>>

export function activeJobOptions(dropdown: DropdownDetail) {
  return dropdown.isActive
    ? dropdown.options.filter((option) => option.isActive).map(({ value, label }) => ({ value, label }))
    : []
}
