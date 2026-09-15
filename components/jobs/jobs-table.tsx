import Link from "next/link"
import {
  BriefcaseBusinessIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
} from "lucide-react"

import { JobStatusBadge } from "@/components/jobs/job-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatJobDate,
  formatJobPay,
  getJobStatusLabel,
} from "@/lib/jobs/presentation"
import type { Job, JobStatus } from "@/lib/jobs/schema"

export type JobStatusFilter =
  | "ALL"
  | Extract<JobStatus, "DRAFT" | "EXPIRED" | "ACTIVE">

type JobPoster = {
  id: string
  name: string
  email: string
}

type JobsTableProps = {
  jobs: Job[]
  pagination: {
    page: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
  statusFilter: JobStatusFilter
  posters: Record<string, JobPoster | null | undefined>
}

const statusFilters: { label: string; value: JobStatusFilter }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Published / open", value: "ACTIVE" },
]

function getStatusFilterLabel(statusFilter: JobStatusFilter) {
  return statusFilter === "ALL" ? "All" : getJobStatusLabel(statusFilter)
}

function getJobsHref(page: number, statusFilter: JobStatusFilter) {
  const params = new URLSearchParams()

  if (page > 1) {
    params.set("page", String(page))
  }

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter)
  }

  const query = params.toString()

  return query ? `/dashboard/jobs?${query}` : "/dashboard/jobs"
}

function getJobDetailsHref(
  jobId: string,
  page: number,
  statusFilter: JobStatusFilter
) {
  const params = new URLSearchParams({ fromPage: String(page) })

  if (statusFilter !== "ALL") {
    params.set("status", statusFilter)
  }

  return `/dashboard/jobs/${encodeURIComponent(jobId)}?${params.toString()}`
}

export function JobsTable({
  jobs,
  pagination,
  statusFilter,
  posters,
}: JobsTableProps) {
  const statusLabel = getStatusFilterLabel(statusFilter).toLowerCase()

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>All jobs</CardTitle>
        <CardDescription>
          {statusFilter === "ALL"
            ? `Showing ${jobs.length} of ${pagination.total.toLocaleString()} jobs.`
            : `Showing ${jobs.length} ${statusLabel} jobs on this page.`}
        </CardDescription>
        <CardAction>
          <div className="flex flex-wrap justify-end gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                asChild
                size="sm"
                variant={filter.value === statusFilter ? "default" : "outline"}
              >
                <Link href={getJobsHref(1, filter.value)}>{filter.label}</Link>
              </Button>
            ))}
          </div>
        </CardAction>
      </CardHeader>

      {jobs.length === 0 ? (
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BriefcaseBusinessIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No jobs found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {statusFilter === "ALL"
              ? "No job postings are currently available."
              : `No ${statusLabel} jobs were found on this page.`}
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-0">
          <Table className="min-w-[1250px] table-fixed">
            <TableCaption className="sr-only">
              A paginated list of Supplyed job postings
            </TableCaption>
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 md:pl-6">Job</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Posted by</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Posted</TableHead>
                <TableHead className="pr-4 text-right md:pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const poster = posters[job.postedByUserId]

                return (
                  <TableRow key={job.id}>
                    <TableCell className="whitespace-normal py-4 pl-4 align-top md:pl-6">
                      <p
                        className="line-clamp-2 break-words font-medium leading-5 [overflow-wrap:anywhere]"
                        title={job.title}
                      >
                        {job.title}
                      </p>
                      <p
                        className="mt-1 line-clamp-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]"
                        title={job.subject || undefined}
                      >
                        {job.subject || "No subject specified"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal py-4 align-top">
                      <p
                        className="line-clamp-2 break-words leading-5 [overflow-wrap:anywhere]"
                        title={job.location || undefined}
                      >
                        {job.location || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-normal py-4 align-top">
                      {poster ? (
                        <Link
                          href={`/dashboard/users/${encodeURIComponent(poster.id)}`}
                          className="block underline-offset-4 hover:underline"
                        >
                          <span
                            className="line-clamp-1 break-words font-medium leading-5 [overflow-wrap:anywhere]"
                            title={poster.name}
                          >
                            {poster.name}
                          </span>
                          <span
                            className="mt-1 line-clamp-1 break-all text-xs text-muted-foreground"
                            title={poster.email}
                          >
                            {poster.email}
                          </span>
                        </Link>
                      ) : (
                        <p
                          className="line-clamp-2 break-all font-mono text-xs text-muted-foreground"
                          title={job.postedByUserId}
                        >
                          {job.postedByUserId}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <p>{formatJobDate(job.startDate)}</p>
                      {job.endDate ? (
                        <p className="text-xs text-muted-foreground">
                          to {formatJobDate(job.endDate)}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      {formatJobPay(job.payAmount, job.payType)}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <JobStatusBadge status={job.status} />
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      {formatJobDate(job.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 pr-4 text-right align-top md:pr-6">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={getJobDetailsHref(
                            job.id,
                            pagination.page,
                            statusFilter
                          )}
                          aria-label={`View details for ${job.title}`}
                        >
                          <EyeIcon data-icon="inline-start" />
                          Details
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      )}

      <CardFooter className="flex-wrap justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          {pagination.page > 1 ? (
            <Button asChild size="sm" variant="outline">
              <Link href={getJobsHref(pagination.page - 1, statusFilter)}>
                <ChevronLeftIcon data-icon="inline-start" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Button>
          )}
          {pagination.hasNextPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={getJobsHref(pagination.page + 1, statusFilter)}>
                Next
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
