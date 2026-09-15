import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react"

import { JobDetailsSkeleton } from "@/components/jobs/jobs-skeleton"
import { JobStatusBadge } from "@/components/jobs/job-status-badge"
import type { JobStatusFilter } from "@/components/jobs/jobs-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getJob } from "@/lib/jobs/get-job"
import { formatJobDate, formatJobPay } from "@/lib/jobs/presentation"
import { getUser } from "@/lib/users/get-user"
import { formatUserRole, getUserDisplayName } from "@/lib/users/presentation"

type JobDetailsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    fromPage?: string | string[]
    status?: string | string[]
  }>
}

const jobStatusFilters: JobStatusFilter[] = ["DRAFT", "EXPIRED", "ACTIVE"]

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

async function JobDetailsContent({ params, searchParams }: JobDetailsPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const fromPage = getPageNumber(query.fromPage)
  const statusFilter = getStatusFilter(query.status)
  const jobsUrl = getJobsHref(fromPage, statusFilter)
  const result = await getJob(id)
  const poster = result.ok ? await getUser(result.job.postedByUserId) : null

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href={jobsUrl}>
            <ArrowLeftIcon data-icon="inline-start" />
            Back to jobs
          </Link>
        </Button>
      </div>

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load job</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h1 className="break-words text-2xl font-semibold tracking-tight [overflow-wrap:anywhere]">
                    {result.job.title}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[result.job.subject, result.job.location]
                      .filter(Boolean)
                      .join(" · ") || "No subject or location specified"}
                  </p>
                </div>
                <JobStatusBadge status={result.job.status} />
              </div>
            </CardContent>
          </Card>

          <div className="grid min-w-0 gap-4 lg:grid-cols-3">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Job description</CardTitle>
                  <CardDescription>
                    Full information supplied for this posting.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap break-words leading-relaxed [overflow-wrap:anywhere]">
                    {result.job.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Job information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Subject</dt>
                      <dd className="mt-1 font-medium">{result.job.subject || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Location</dt>
                      <dd className="mt-1 font-medium">{result.job.location || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Pay</dt>
                      <dd className="mt-1 font-medium">
                        {formatJobPay(result.job.payAmount, result.job.payType)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Start date</dt>
                      <dd className="mt-1 font-medium">{formatJobDate(result.job.startDate, true)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">End date</dt>
                      <dd className="mt-1 font-medium">{formatJobDate(result.job.endDate, true)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Expires</dt>
                      <dd className="mt-1 font-medium">{formatJobDate(result.job.expiresAt, true)}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 grid gap-6 border-t pt-5 sm:grid-cols-2">
                    <div className="min-w-0">
                      <h2 className="text-xs font-medium text-muted-foreground">Key stages</h2>
                      {result.job.keyStages.length > 0 ? (
                        <ul className="mt-2 flex flex-wrap gap-2" aria-label="Key stages">
                          {result.job.keyStages.map((stage) => (
                            <li
                              key={stage}
                              className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium"
                            >
                              {stage}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">No key stages specified.</p>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs font-medium text-muted-foreground">Parking information</h2>
                      <p className="mt-2 break-words text-sm [overflow-wrap:anywhere]">
                        {result.job.parkingInfo || "No parking information provided."}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="min-w-0 space-y-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Posted by</CardTitle>
                  <CardDescription>The account that created this job.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {poster?.ok ? (
                    <>
                      <div>
                        <p className="font-medium">{getUserDisplayName(poster.user)}</p>
                        <p className="mt-0.5 break-all text-sm text-muted-foreground">
                          {poster.user.email}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatUserRole(poster.user.role)}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/users/${encodeURIComponent(poster.user.id)}`}>
                          View user
                          <ExternalLinkIcon data-icon="inline-end" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Poster details are unavailable.
                    </p>
                  )}
                  <div className="border-t pt-4">
                    <p className="text-xs font-medium text-muted-foreground">Poster user ID</p>
                    <p className="mt-1 break-all font-mono text-xs">
                      {result.job.postedByUserId}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Record information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Job ID</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{result.job.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                      <dd className="mt-1">{formatJobDate(result.job.createdAt, true)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Last updated</dt>
                      <dd className="mt-1">{formatJobDate(result.job.updatedAt, true)}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function JobDetailsPage(props: JobDetailsPageProps) {
  return (
    <Suspense fallback={<JobDetailsSkeleton />}>
      <JobDetailsContent {...props} />
    </Suspense>
  )
}

