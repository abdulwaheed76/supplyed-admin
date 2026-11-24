"use client"

import { useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { degreeChecksHref, readDegreeCheckFilters, type DegreeCheckFilters } from "@/lib/degree-checks/filters"
import { getDegreeCheckStatusLabel } from "@/lib/degree-checks/presentation"
import { DEGREE_CHECK_STATUSES } from "@/lib/degree-checks/schema"

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const pageSizes = [10, 20, 50, 100]

export function DegreeCheckFiltersForm({ filters }: { filters: DegreeCheckFilters }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextFilters = readDegreeCheckFilters({
      status: String(formData.get("status") ?? ""),
      needsAction: String(formData.get("needsAction") ?? "true"),
      limit: String(formData.get("limit") ?? "20"),
    })

    startTransition(() => {
      router.push(degreeChecksHref(nextFilters), { scroll: false })
    })
  }

  return (
    <Card size="sm">
      <CardContent>
        <form action="/dashboard/degree-checks" method="get" onSubmit={applyFilters} aria-busy={isPending}>
          <fieldset disabled={isPending} className="flex min-w-0 flex-wrap items-end gap-3">
            <div className="grid min-w-40 flex-1 gap-1.5 sm:max-w-52">
              <Label htmlFor="degree-check-show">Show</Label>
              <select
                id="degree-check-show"
                name="needsAction"
                defaultValue={filters.needsAction ? "true" : "false"}
                className={selectClass}
              >
                <option value="true">Needs action</option>
                <option value="false">All checks</option>
              </select>
            </div>
            <div className="grid min-w-40 flex-1 gap-1.5 sm:max-w-52">
              <Label htmlFor="degree-check-status">Status</Label>
              <select id="degree-check-status" name="status" defaultValue={filters.status ?? ""} className={selectClass}>
                <option value="">All statuses</option>
                {DEGREE_CHECK_STATUSES.map((status) => (
                  <option key={status} value={status}>{getDegreeCheckStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="grid min-w-28 gap-1.5">
              <Label htmlFor="degree-check-limit">Per page</Label>
              <select id="degree-check-limit" name="limit" defaultValue={filters.limit} className={selectClass}>
                {!pageSizes.includes(filters.limit) ? <option value={filters.limit}>{filters.limit}</option> : null}
                {pageSizes.map((limit) => <option key={limit} value={limit}>{limit}</option>)}
              </select>
            </div>
            <Button type="submit" className="h-9">
              {isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
              {isPending ? "Applying..." : "Apply filters"}
            </Button>
            <Button asChild variant="ghost" className="h-9">
              <Link href="/dashboard/degree-checks" scroll={false}>Clear</Link>
            </Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}
