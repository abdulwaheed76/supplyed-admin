import Link from "next/link"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  RefreshCwIcon,
} from "lucide-react"

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
import { DeleteUserButton } from "@/components/users/delete-user-button"
import { CreateUserDialog } from "@/components/users/create-user-dialog"
import { UserFiltersForm } from "@/components/users/user-filters"
import { VerifiedBadge } from "@/components/users/verified-badge"
import { getCurrentSession } from "@/lib/auth/session"
import { getUsers, type UserFilters } from "@/lib/users/get-users"
import { getVerifiedUserIds } from "@/lib/users/get-verified-user-ids"
import {
  formatUserDate,
  formatUserDateTime,
  formatUserRole,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/users/presentation"
import type { UserListItem } from "@/lib/users/schema"

const PAGE_SIZE = 20

type UsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getPageNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  const page = Number(candidate)

  return Number.isInteger(page) && page > 0 ? page : 1
}

function ProfileStatus({ user }: { user: UserListItem }) {
  if (!user.profileStatus && !["INSTRUCTOR", "INSTITUTION", "RECRUITER"].includes(user.role)) {
    return <span className="text-muted-foreground">-</span>
  }

  const status = user.profileStatus || "NOT_FOUND"
  const label = status === "NOT_FOUND" ? "Not found" : formatUserRole(status)
  const className =
    status === "ACTIVE" || status === "VERIFIED"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "PENDING"
        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : status === "SUSPENDED" || status === "DEACTIVATED"
          ? "bg-destructive/10 text-destructive"
          : "bg-muted text-muted-foreground"

  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={verified
        ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
        : "inline-flex rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"}
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  )
}

const filterNames = ["search", "role", "accountType", "countries", "profileStatus", "emailVerified", "phoneVerified", "joined", "createdFrom", "createdTo", "sortBy", "sortOrder"] as const

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const page = getPageNumber(params.page)
  const filters: UserFilters = {}
  for (const name of filterNames) {
    const value = Array.isArray(params[name]) ? params[name][0] : params[name]
    if (value?.trim()) filters[name] = value.trim()
  }
  const pageHref = (number: number) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value)
    query.set("page", String(number))
    return "/dashboard/users?" + query.toString()
  }
  const [result, session] = await Promise.all([
    getUsers({ page, limit: PAGE_SIZE, ...filters }),
    getCurrentSession(),
  ])
  const verifiedUserIds = result.ok ? await getVerifiedUserIds(result.users) : new Set<string>()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage the people using the Supplyed platform.
          </p>
          </div>
          <CreateUserDialog />
        </div>

        <UserFiltersForm filters={filters} />

        {!result.ok ? (
          <Card role="alert">
            <CardHeader>
              <CardTitle>Unable to load users</CardTitle>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/dashboard/users">
                  <RefreshCwIcon data-icon="inline-start" />
                  Try again
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>All users</CardTitle>
              <CardDescription>
                {result.pagination.total === undefined
                  ? `Showing ${result.users.length} users on page ${result.pagination.page}.`
                  : `Showing ${result.users.length} of ${result.pagination.total.toLocaleString()} users.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="min-w-[1100px]">
                <TableCaption className="sr-only">
                  A paginated list of Supplyed users
                </TableCaption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 md:pl-6">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Phone number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last login</TableHead>
                    <TableHead className="pr-4 text-right md:pr-6">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.users.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={8}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No users found on this page.
                      </TableCell>
                    </TableRow>
                  ) : (
                    result.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="pl-4 md:pl-6">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                            >
                              {getUserInitials(user)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 font-medium">
                                {getUserDisplayName(user)}
                                {verifiedUserIds.has(user.id) ? <VerifiedBadge /> : null}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <span className="max-w-[240px] break-all">{user.email}</span>
                            <VerificationBadge verified={user.emailVerified} />
                          </div>
                        </TableCell>
                        <TableCell>{formatUserRole(user.role)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-1">
                            <span>{user.phone || "Not provided"}</span>
                            {user.phone ? <VerificationBadge verified={user.phoneVerified ?? false} /> : null}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ProfileStatus user={user} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatUserDate(user.createdAt)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatUserDateTime(user.lastLogin)}</TableCell>
                        <TableCell className="pr-4 md:pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={`/dashboard/users/${encodeURIComponent(user.id)}`}
                                aria-label={`View details for ${getUserDisplayName(user)}`}
                              >
                                <EyeIcon data-icon="inline-start" />
                                Details
                              </Link>
                            </Button>
                            <DeleteUserButton
                              user={user}
                              currentUserId={session?.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex-wrap justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Page {result.pagination.page}
                {result.pagination.totalPages !== undefined
                  ? ` of ${Math.max(result.pagination.totalPages, 1)}`
                  : ""}
              </p>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={pageHref(page - 1)}>
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
                {result.pagination.hasNextPage ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={pageHref(page + 1)}>
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
        )}
    </div>
  )
}
