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
import { formatJobDate, formatJobPay } from "@/lib/jobs/presentation"
import type { Job } from "@/lib/jobs/schema"

type JobsTableProps = {
  jobs: Job[]
  pagination: {
    page: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
}

export function JobsTable({ jobs, pagination }: JobsTableProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>All jobs</CardTitle>
        <CardDescription>
          Showing {jobs.length} of {pagination.total.toLocaleString()} jobs.
        </CardDescription>
      </CardHeader>

      {jobs.length === 0 ? (
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BriefcaseBusinessIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No jobs found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No active job postings are currently available.
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-0">
          <Table className="min-w-[1100px] table-fixed">
            <TableCaption className="sr-only">
              A paginated list of Supplyed job postings
            </TableCaption>
            <colgroup>
              <col className="w-[25%]" />
              <col className="w-[21%]" />
              <col className="w-[14%]" />
              <col className="w-[10%]" />
              <col className="w-[8%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 md:pl-6">Job</TableHead>
                <TableHead>Location</TableHead>
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
              {jobs.map((job) => (
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
                        href={`/dashboard/jobs/${encodeURIComponent(job.id)}?fromPage=${pagination.page}`}
                        aria-label={`View details for ${job.title}`}
                      >
                        <EyeIcon data-icon="inline-start" />
                        Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
              <Link href={`/dashboard/jobs?page=${pagination.page - 1}`}>
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
              <Link href={`/dashboard/jobs?page=${pagination.page + 1}`}>
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
