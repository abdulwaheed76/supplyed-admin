"use client"

import { useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  readWaitingListFilters,
  waitingListHref,
  type WaitingListFilters,
} from "@/lib/waiting-list/filters"
import {
  getSubmissionStatusLabel,
  getSubmissionTypeLabel,
} from "@/lib/waiting-list/presentation"
import { submissionStatusSchema, submissionTypeSchema } from "@/lib/waiting-list/schema"

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
const pageSizes = [10, 20, 50, 100]

export function WaitingListFiltersForm({ filters }: { filters: WaitingListFilters }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nextFilters = readWaitingListFilters({
      search: String(formData.get("search") ?? ""),
      type: String(formData.get("type") ?? ""),
      status: String(formData.get("status") ?? ""),
      limit: String(formData.get("limit") ?? "20"),
      fromDate: String(formData.get("fromDate") ?? ""),
      toDate: String(formData.get("toDate") ?? ""),
    })

    startTransition(() => {
      router.push(waitingListHref(nextFilters), { scroll: false })
    })
  }

  return (
    <Card size="sm">
      <CardContent>
        <form action="/dashboard/waiting-list" method="get" onSubmit={applyFilters} aria-busy={isPending}>
          <fieldset disabled={isPending} className="flex min-w-0 flex-wrap items-end gap-3">
            <div className="grid min-w-52 flex-1 gap-1.5">
              <Label htmlFor="waiting-list-search">Search submissions</Label>
              <div className="relative">
                <SearchIcon aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="waiting-list-search"
                  name="search"
                  type="search"
                  defaultValue={filters.search ?? ""}
                  placeholder="Name, email, organisation or postcode"
                  className="h-9 pl-9"
                />
              </div>
            </div>
            <div className="grid min-w-32 flex-1 gap-1.5 sm:max-w-40">
              <Label htmlFor="waiting-list-type">Type</Label>
              <select id="waiting-list-type" name="type" defaultValue={filters.type ?? ""} className={selectClass}>
                <option value="">All types</option>
                {submissionTypeSchema.options.map((type) => (
                  <option key={type} value={type}>{getSubmissionTypeLabel(type)}</option>
                ))}
              </select>
            </div>
            <div className="grid min-w-36 flex-1 gap-1.5 sm:max-w-44">
              <Label htmlFor="waiting-list-status">Status</Label>
              <select id="waiting-list-status" name="status" defaultValue={filters.status ?? ""} className={selectClass}>
                <option value="">All statuses</option>
                {submissionStatusSchema.options.map((status) => (
                  <option key={status} value={status}>{getSubmissionStatusLabel(status)}</option>
                ))}
              </select>
            </div>
            <div className="grid min-w-28 gap-1.5">
              <Label htmlFor="waiting-list-limit">Per page</Label>
              <select id="waiting-list-limit" name="limit" defaultValue={filters.limit} className={selectClass}>
                {!pageSizes.includes(filters.limit) ? <option value={filters.limit}>{filters.limit}</option> : null}
                {pageSizes.map((limit) => <option key={limit} value={limit}>{limit}</option>)}
              </select>
            </div>
            <div className="grid min-w-40 gap-1.5">
              <Label htmlFor="waiting-list-date-from">From date</Label>
              <Input
                id="waiting-list-date-from"
                name="fromDate"
                type="date"
                defaultValue={filters.fromDate ?? ""}
                max={filters.toDate}
                className="h-9"
              />
            </div>
            <div className="grid min-w-40 gap-1.5">
              <Label htmlFor="waiting-list-date-to">To date</Label>
              <Input
                id="waiting-list-date-to"
                name="toDate"
                type="date"
                defaultValue={filters.toDate ?? ""}
                min={filters.fromDate}
                className="h-9"
              />
            </div>
            <Button type="submit" className="h-9">
              {isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
              {isPending ? "Applying..." : "Apply filters"}
            </Button>
            <Button asChild variant="ghost" className="h-9">
              <Link href="/dashboard/waiting-list" scroll={false}>Clear</Link>
            </Button>
          </fieldset>
          <p className="mt-2 text-xs text-muted-foreground">
            Date ranges filter the created date and include both selected days in UTC.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
