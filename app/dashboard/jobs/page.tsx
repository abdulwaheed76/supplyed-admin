import { Suspense } from "react"
import Link from "next/link"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

import { JobsListSkeleton } from "@/components/jobs/jobs-skeleton"
import { JobsTable, type JobStatusFilter } from "@/components/jobs/jobs-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getJobs } from "@/lib/jobs/get-jobs"
import { getUser } from "@/lib/users/get-user"
import { getUserDisplayName } from "@/lib/users/presentation"

const PAGE_SIZE = 20

const jobStatusFilters: JobStatusFilter[] = ["DRAFT", "EXPIRED", "ACTIVE"]

type JobsPageProps = {
  searchParams: Promise<{ page?: string | string[]; status?: string | string[] }>
}

function getPageNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  const page = Number(candidate)

  return Number.isInteger(page) && page > 0 ? page : 1
}

function getStatusFilter(value: string | string[] | undefined): JobStatusFilter {
  const candidate = Array.isArray(value) ? value[0] : value

  return jobStatusFilters.includes(candidate as JobStatusFilter)
    ? (candidate as JobStatusFilter)
    : "ALL"
}

async function JobsContent({ searchParams }: JobsPageProps) {
  const query = await searchParams
  const page = getPageNumber(query.page)
  const statusFilter = getStatusFilter(query.status)
  const result = await getJobs({ page, limit: PAGE_SIZE })

  if (!result.ok) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View job postings and open their complete listing details.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <PlusIcon data-icon="inline-start" />
              Create job
            </Link>
          </Button>
        </div>

        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load jobs</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/jobs">
                <RefreshCwIcon data-icon="inline-start" />
                Try again
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const jobs =
    statusFilter === "ALL"
      ? result.jobs
      : result.jobs.filter((job) => job.status === statusFilter)
  const posterIds = [...new Set(jobs.map((job) => job.postedByUserId))]
  const posterResults = await Promise.all(
    posterIds.map(async (userId) => ({ userId, result: await getUser(userId) }))
  )
  const posters = Object.fromEntries(
    posterResults.map(({ userId, result }) => [
      userId,
      result.ok
        ? {
            id: result.user.id,
            name: getUserDisplayName(result.user),
            email: result.user.email,
          }
        : null,
    ])
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View job postings and open their complete listing details.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/new">
            <PlusIcon data-icon="inline-start" />
            Create job
          </Link>
        </Button>
      </div>

      <JobsTable
        jobs={jobs}
        pagination={result.pagination}
        statusFilter={statusFilter}
        posters={posters}
      />
    </div>
  )
}

export default function JobsPage(props: JobsPageProps) {
  return (
    <Suspense fallback={<JobsListSkeleton />}>
      <JobsContent {...props} />
    </Suspense>
  )
}
