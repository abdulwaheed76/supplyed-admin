import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, ScanFaceIcon } from "lucide-react"

import {
  IdentityCheckDecisionBadge,
  IdentityCheckOutcomeBadge,
  IdentityCheckStatusBadge,
} from "@/components/identity-checks/identity-check-badges"
import { IdentityCheckFiltersForm } from "@/components/identity-checks/identity-check-filters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { identityChecksHref, readIdentityCheckFilters } from "@/lib/identity-checks/filters"
import { getIdentityChecks } from "@/lib/identity-checks/get-identity-checks"
import { formatIdentityCheckDate, formatEnumLabel, getIdentityCheckName } from "@/lib/identity-checks/presentation"

type IdentityChecksPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function IdentityChecksPage({ searchParams }: IdentityChecksPageProps) {
  const filters = readIdentityCheckFilters(await searchParams)
  const result = await getIdentityChecks(filters)
  const hasFilters = Boolean(filters.status || filters.outcome || filters.needsDecision || filters.userId)

  if (result.ok && filters.page > Math.max(result.pagination.totalPages, 1)) {
    redirect(identityChecksHref({ ...filters, page: Math.max(result.pagination.totalPages, 1) }))
  }

  const pageHref = (page: number) => identityChecksHref({ ...filters, page })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Identity checks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teachers&apos; TrustID identity and right to work checks. A teacher can&apos;t be approved until their identity is. Checks waiting for you are marked &quot;Needs decision&quot;.
        </p>
      </div>

      <IdentityCheckFiltersForm key={JSON.stringify(filters)} filters={filters} />

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load identity checks</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{hasFilters ? "Matching checks" : "All checks"}</CardTitle>
            <CardDescription>
              {result.pagination.total === 0
                ? "No checks to show."
                : `Showing ${((result.pagination.page - 1) * result.pagination.limit + 1).toLocaleString()}–${((result.pagination.page - 1) * result.pagination.limit + result.checks.length).toLocaleString()} of ${result.pagination.total.toLocaleString()} checks.`}
              {" "}Newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[980px]">
              <TableCaption className="sr-only">TrustID identity checks, newest first</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 md:pl-6">Teacher</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Right to work</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead className="pr-4 text-right md:pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.checks.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="h-48 whitespace-normal text-center">
                      <ScanFaceIcon aria-hidden="true" className="mx-auto mb-3 size-8 text-muted-foreground" />
                      <p className="font-medium">{hasFilters ? "No matching checks" : "No identity checks yet"}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {hasFilters
                          ? "Try other filters or clear them."
                          : "Checks appear here when teachers start TrustID verification."}
                      </p>
                      {hasFilters ? (
                        <Button asChild variant="outline" size="sm" className="mt-3">
                          <Link href={identityChecksHref({ page: 1, limit: filters.limit })}>Clear filters</Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ) : result.checks.map((check) => (
                  <TableRow key={check.id}>
                    <TableCell className="pl-4 md:pl-6">
                      <div className="max-w-72 whitespace-normal break-words font-medium">{getIdentityCheckName(check)}</div>
                      <div className="mt-1 max-w-72 whitespace-normal break-all text-xs text-muted-foreground">{check.user.email}</div>
                    </TableCell>
                    <TableCell><IdentityCheckStatusBadge status={check.status} /></TableCell>
                    <TableCell><IdentityCheckOutcomeBadge outcome={check.outcome} /></TableCell>
                    <TableCell>
                      <IdentityCheckDecisionBadge decision={check.decision} needsDecision={check.needsDecision === true} />
                    </TableCell>
                    <TableCell>{formatEnumLabel(check.rightToWorkStatus)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatIdentityCheckDate(check.createdAt)}</TableCell>
                    <TableCell className="pr-4 text-right md:pr-6">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/identity-checks/${encodeURIComponent(check.id)}`}>View</Link>
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
            <nav aria-label="Identity checks pagination" className="flex items-center gap-2">
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
