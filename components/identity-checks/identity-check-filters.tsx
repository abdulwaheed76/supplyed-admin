"use client"

import { useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  identityChecksHref,
  readIdentityCheckFilters,
  type IdentityCheckFilters,
} from "@/lib/identity-checks/filters"
import {
  getIdentityCheckOutcomeLabel,
  getIdentityCheckStatusLabel,
} from "@/lib/identity-checks/presentation"
import {
  IDENTITY_CHECK_OUTCOMES,
  IDENTITY_CHECK_STATUSES,
} from "@/lib/identity-checks/schema"

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const pageSizes = [10, 20, 50, 100]

export function IdentityCheckFiltersForm({ filters }: { filters: IdentityCheckFilters }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextFilters = readIdentityCheckFilters({
      status: String(formData.get("status") ?? ""),
      outcome: String(formData.get("outcome") ?? ""),
      needsDecision: String(formData.get("needsDecision") ?? ""),
      limit: String(formData.get("limit") ?? "20"),
      // Kept when the list was opened for one teacher, e.g. from their profile.
      userId: filters.userId,
    })

    startTransition(() => {
      router.push(identityChecksHref(nextFilters), { scroll: false })
    })
  }

  return (
    <Card size="sm">
      <CardContent>
        <form action="/dashboard/identity-checks" method="get" onSubmit={applyFilters} aria-busy={isPending}>
          <fieldset disabled={isPending} className="flex min-w-0 flex-wrap items-end gap-3">
            {filters.userId ? <input type="hidden" name="userId" value={filters.userId} /> : null}
            <div className="grid min-w-40 flex-1 gap-1.5 sm:max-w-52">
              <Label htmlFor="identity-check-status">Status</Label>
              <select id="identity-check-status" name="status" defaultValue={filters.status ?? ""} className={selectClass}>
                <option value="">All statuses</option>
                {IDENTITY_CHECK_STATUSES.map((status) => (
                  <option key={status} value={status}>{getIdentityCheckStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="grid min-w-40 flex-1 gap-1.5 sm:max-w-52">
              <Label htmlFor="identity-check-outcome">Outcome</Label>
              <select id="identity-check-outcome" name="outcome" defaultValue={filters.outcome ?? ""} className={selectClass}>
                <option value="">All outcomes</option>
                {IDENTITY_CHECK_OUTCOMES.map((outcome) => (
                  <option key={outcome} value={outcome}>{getIdentityCheckOutcomeLabel(outcome)}</option>
                ))}
              </select>
            </div>
            <div className="grid min-w-40 flex-1 gap-1.5 sm:max-w-52">
              <Label htmlFor="identity-check-decision">Decision</Label>
              <select
                id="identity-check-decision"
                name="needsDecision"
                defaultValue={filters.needsDecision ? "true" : ""}
                className={selectClass}
              >
                <option value="">Any</option>
                <option value="true">Needs decision</option>
              </select>
            </div>
            <div className="grid min-w-28 gap-1.5">
              <Label htmlFor="identity-check-limit">Per page</Label>
              <select id="identity-check-limit" name="limit" defaultValue={filters.limit} className={selectClass}>
                {!pageSizes.includes(filters.limit) ? <option value={filters.limit}>{filters.limit}</option> : null}
                {pageSizes.map((limit) => <option key={limit} value={limit}>{limit}</option>)}
              </select>
            </div>
            <Button type="submit" className="h-9">
              {isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
              {isPending ? "Applying..." : "Apply filters"}
            </Button>
            <Button asChild variant="ghost" className="h-9">
              <Link href="/dashboard/identity-checks" scroll={false}>Clear</Link>
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}
