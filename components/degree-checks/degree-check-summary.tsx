import Link from "next/link"

import { getLatestDegreeCheckForUser } from "@/lib/degree-checks/get-degree-checks"
import { formatVerifiedDegree, getDegreeCheckStatusLabel } from "@/lib/degree-checks/presentation"

/** The teacher's latest degree check in one line, linking to it. */
export async function DegreeCheckSummary({ userId }: { userId: string }) {
  const result = await getLatestDegreeCheckForUser(userId)

  if (!result.ok) {
    return <span className="text-sm text-muted-foreground">Unable to load</span>
  }

  const { check } = result

  if (!check) {
    return <>Not checked</>
  }

  const text =
    check.decision === "APPROVED" && check.degree
      ? `Verified: ${formatVerifiedDegree(check.degree)}`
      : check.decision === "REJECTED"
        ? "Rejected"
        : getDegreeCheckStatusLabel(check.status)

  return (
    <Link href={`/dashboard/degree-checks/${encodeURIComponent(check.id)}`} className="underline underline-offset-4">
      {text}
    </Link>
  )
}
