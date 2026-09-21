import { BadgeCheckIcon } from "lucide-react"

export function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <BadgeCheckIcon aria-hidden="true" className="size-3.5" />
      Verified
    </span>
  )
}
