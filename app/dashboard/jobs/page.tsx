import { Suspense } from "react"
import Link from "next/link"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

import { JobsListSkeleton } from "@/components/jobs/jobs-skeleton"
import { JobsTable } from "@/components/jobs/jobs-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getJobs } from "@/lib/jobs/get-jobs"

const PAGE_SIZE = 20

type JobsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

function getPageNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  const page = Number(candidate)

  return Number.isInteger(page) && page > 0 ? page : 1
}

async function JobsContent({ searchParams }: JobsPageProps) {
  const page = getPageNumber((await searchParams).page)
  const result = await getJobs({ page, limit: PAGE_SIZE })

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

      {!result.ok ? (
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
      ) : (
        <JobsTable jobs={result.jobs} pagination={result.pagination} />
      )}
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
