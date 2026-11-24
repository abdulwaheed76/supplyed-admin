import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, GraduationCapIcon } from "lucide-react"

import { DegreeCheckStatusBadge, NeedsActionBadge } from "@/components/degree-checks/degree-check-badges"
import { DegreeCheckFiltersForm } from "@/components/degree-checks/degree-check-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { degreeChecksHref, readDegreeCheckFilters } from "@/lib/degree-checks/filters"
import { getDegreeChecks } from "@/lib/degree-checks/get-degree-checks"
import { formatEnteredDegree, getDegreeCheckName } from "@/lib/degree-checks/presentation"
import { formatIdentityCheckDate } from "@/lib/identity-checks/presentation"

type DegreeChecksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DegreeChecksPage({ searchParams }: DegreeChecksPageProps) {
  const filters = readDegreeCheckFilters(await searchParams)
  const result = await getDegreeChecks(filters)
  const hasFilters = Boolean(filters.status || filters.needsAction)

  if (result.ok && filters.page > Math.max(result.pagination.totalPages, 1)) {
    redirect(degreeChecksHref({ ...filters, page: Math.max(result.pagination.totalPages, 1) }))
  }

  const pageHref = (page: number) => degreeChecksHref({ ...filters, page })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Degree checks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional checks, through Hedd, that a teacher holds the UK degree they say. A verified degree shows to schools;
          nothing else waits for it. Opens on the checks that need you.
        </p>
      </div>

      <DegreeCheckFiltersForm key={JSON.stringify(filters)} filters={filters} />

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load degree checks</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{filters.needsAction ? "Checks that need action" : hasFilters ? "Matching checks" : "All checks"}</CardTitle>
            <CardDescription>
              {result.pagination.total === 0
                ? "No checks to show."
                : `Showing ${((result.pagination.page - 1) * result.pagination.limit + 1).toLocaleString()}–${((result.pagination.page - 1) * result.pagination.limit + result.checks.length).toLocaleString()} of ${result.pagination.total.toLocaleString()} checks.`}
              {" "}Newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[980px]">
              <TableCaption className="sr-only">Hedd degree checks, newest first</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 md:pl-6">Teacher</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="pr-4 text-right md:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.checks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={6} className="h-48 whitespace-normal text-center">
                      <GraduationCapIcon aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
                      <p className="font-medium">
                        {filters.needsAction ? "Nothing needs you" : hasFilters ? "No matching checks" : "No degree checks yet"}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {filters.needsAction
                          ? "Checks appear here when Hedd's answer didn't arrive, the university wants more, or it corrected something."
                          : "Checks appear here when teachers send their degree to Hedd."}
                      </p>
                      {filters.needsAction ? (
                        <Button asChild variant="outline" size="sm" className="mt-3">
                          <Link href={degreeChecksHref({ ...filters, needsAction: false, page: 1 })}>Show all checks</Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ) : result.checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="pl-4 md:pl-6">
                      <Link
                        href={`/dashboard/users/${encodeURIComponent(check.user.id)}`}
                        className="block max-w-72 whitespace-normal break-words font-medium underline-offset-4 hover:underline"
                      >
                        {getDegreeCheckName(check)}
                      </Link>
                      <div className="mt-1 max-w-72 whitespace-normal break-all text-xs text-muted-foreground">{check.user.email}</div>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal">{check.institutionName}</TableCell>
                    <TableCell className="max-w-64 whitespace-normal">{formatEnteredDegree(check)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DegreeCheckStatusBadge check={check} />
                        {check.needsAction ? <NeedsActionBadge /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatIdentityCheckDate(check.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right md:pr-6">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/degree-checks/${encodeURIComponent(check.id)}`}>View</Link>
                      </Button>
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
            <nav aria-label="Degree checks pagination" className="flex items-center gap-2">
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
