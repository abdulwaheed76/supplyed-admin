import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, ListChecksIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ExportWaitingListButton } from "@/components/waiting-list/export-waiting-list-button"
import { RefreshWaitingListButton } from "@/components/waiting-list/refresh-waiting-list-button"
import { SubmissionDetailsDialog } from "@/components/waiting-list/submission-details-dialog"
import { SubmissionStatusBadge } from "@/components/waiting-list/submission-status-badge"
import { WaitingListFiltersForm } from "@/components/waiting-list/waiting-list-filters"
import { readWaitingListFilters, waitingListHref } from "@/lib/waiting-list/filters"
import { getSubmissions } from "@/lib/waiting-list/get-submissions"
import { formatSubmissionDate, getSubmissionTypeLabel } from "@/lib/waiting-list/presentation"

type WaitingListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function WaitingListPage({ searchParams }: WaitingListPageProps) {
  const filters = readWaitingListFilters(await searchParams)
  const result = await getSubmissions(filters)
  const hasFilters = Boolean(
    filters.search ||
      filters.type ||
      filters.status ||
      filters.fromDate ||
      filters.toDate
  )

  // A status change can remove the last matching row from the current page.
  if (result.ok && filters.page > Math.max(result.pagination.totalPages, 1)) {
    redirect(waitingListHref({ ...filters, page: Math.max(result.pagination.totalPages, 1) }))
  }

  const pageHref = (page: number) => waitingListHref({ ...filters, page })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Waiting List</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review school and teacher interest, and keep each submission&apos;s status up to date.
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-2">
          <ExportWaitingListButton />
          <RefreshWaitingListButton />
        </div>
      </div>

      <WaitingListFiltersForm key={JSON.stringify(filters)} filters={filters} />

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load the waiting list</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <RefreshWaitingListButton label="Try again" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{hasFilters ? "Matching submissions" : "All submissions"}</CardTitle>
            <CardDescription>
              {result.pagination.total === 0
                ? "No submissions to show."
                : `Showing ${((result.pagination.page - 1) * result.pagination.limit + 1).toLocaleString()}–${((result.pagination.page - 1) * result.pagination.limit + result.submissions.length).toLocaleString()} of ${result.pagination.total.toLocaleString()} submissions.`}
              {" "}Newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[950px]">
              <TableCaption className="sr-only">School and teacher waiting list submissions, newest first</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 md:pl-6">Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="pr-4 text-right md:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.submissions.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="h-48 whitespace-normal text-center">
                      <ListChecksIcon aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
                      <p className="font-medium">{hasFilters ? "No matching submissions" : "The waiting list is empty"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters ? "Try another search or clear the filters." : "New school and teacher submissions will appear here."}
                      </p>
                      {hasFilters ? (
                        <Button asChild variant="outline" size="sm" className="mt-3">
                          <Link href={waitingListHref({ page: 1, limit: filters.limit })}>Clear filters</Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ) : result.submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="pl-4 md:pl-6">
                      <div className="max-w-72 whitespace-normal break-words font-medium">{submission.name}</div>
                      <div className="mt-1 max-w-72 whitespace-normal break-all text-xs text-muted-foreground">{submission.email}</div>
                    </TableCell>
                    <TableCell>{getSubmissionTypeLabel(submission.type)}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal break-words">{submission.organizationName || "Not provided"}</TableCell>
                    <TableCell>{submission.area || submission.postcode || "Not provided"}</TableCell>
                    <TableCell><SubmissionStatusBadge status={submission.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{formatSubmissionDate(submission.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right md:pr-6">
                      <SubmissionDetailsDialog submission={submission} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Page {result.pagination.page} of {Math.max(result.pagination.totalPages, 1)}
            </p>
            <nav aria-label="Waiting list pagination" className="flex items-center gap-2">
              {result.pagination.page > 1 ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={pageHref(result.pagination.page - 1)} scroll={false}>
                    <ChevronLeftIcon aria-hidden="true" />Previous
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled><ChevronLeftIcon aria-hidden="true" />Previous</Button>
              )}
              {result.pagination.hasNextPage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={pageHref(result.pagination.page + 1)} scroll={false}>
                    Next<ChevronRightIcon aria-hidden="true" />
                  </Link>
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled>Next<ChevronRightIcon aria-hidden="true" /></Button>
              )}
            </nav>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
