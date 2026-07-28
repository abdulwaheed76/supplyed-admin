import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { InstitutionProfileCard } from "@/components/users/institution-profile-card"
import { InstructorProfileCard } from "@/components/users/instructor-profile-card"
import { getUser } from "@/lib/users/get-user"
import {
  getRoleProfile,
  type RoleProfileResult,
} from "@/lib/users/get-role-profile"
import {
  formatUserDate,
  formatUserRole,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/users/presentation"

type UserDetailsPageProps = {
  params: Promise<{ id: string }>
}

function VerificationStatus({ verified }: { verified: boolean }) {
  return (
    <span
      className={
        verified
          ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
          : "inline-flex rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
      }
    >
      {verified ? "Verified" : "Not verified"}
    </span>
  )
}

function BooleanStatus({ enabled }: { enabled: boolean }) {
  return enabled ? "Enabled" : "Disabled"
}

function RoleProfileView({ result }: { result: RoleProfileResult | null }) {
  if (!result || (result.ok && result.kind === "none")) {
    return null
  }

  if (!result.ok) {
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Unable to load role profile</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!result.profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {result.kind === "instructor"
              ? "Instructor profile"
              : "Institution profile"}
          </CardTitle>
          <CardDescription>
            No matching {result.kind} profile was found for this user.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return result.kind === "instructor" ? (
    <InstructorProfileCard profile={result.profile} />
  ) : (
    <InstitutionProfileCard profile={result.profile} />
  )
}

export default async function UserDetailsPage({
  params,
}: UserDetailsPageProps) {
  const result = await getUser((await params).id)
  const roleProfile = result.ok ? await getRoleProfile(result.user) : null

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <Button asChild size="sm" variant="ghost" className="-ml-2">
            <Link href="/dashboard/users">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to users
            </Link>
          </Button>
        </div>

        {!result.ok ? (
          <Card role="alert">
            <CardHeader>
              <CardTitle>Unable to load user</CardTitle>
              <CardDescription>{result.message}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <span
                  aria-hidden="true"
                  className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary"
                >
                  {getUserInitials(result.user)}
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {getUserDisplayName(result.user)}
                  </h1>
                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {result.user.email}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {formatUserRole(result.user.role)}
                    </span>
                    <VerificationStatus
                      verified={result.user.emailVerified}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <RoleProfileView result={roleProfile} />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Profile information</CardTitle>
                  <CardDescription>
                    Account and contact information for this user.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        User ID
                      </dt>
                      <dd className="mt-1 break-all font-mono text-xs">
                        {result.user.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Role
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatUserRole(result.user.role)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Email
                      </dt>
                      <dd className="mt-1 break-all">{result.user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Phone
                      </dt>
                      <dd className="mt-1">{result.user.phone || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Joined
                      </dt>
                      <dd className="mt-1">
                        {formatUserDate(result.user.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Last updated
                      </dt>
                      <dd className="mt-1">
                        {formatUserDate(result.user.updatedAt)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Security and activity</CardTitle>
                  <CardDescription>
                    Verification and account security information.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Email verification
                      </dt>
                      <dd className="mt-2">
                        <VerificationStatus
                          verified={result.user.emailVerified}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Phone verification
                      </dt>
                      <dd className="mt-2">
                        <VerificationStatus
                          verified={result.user.phoneVerified ?? false}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Two-factor authentication
                      </dt>
                      <dd className="mt-1 font-medium">
                        <BooleanStatus
                          enabled={result.user.twoFactorEnabled ?? false}
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        Last login
                      </dt>
                      <dd className="mt-1">
                        {formatUserDate(result.user.lastLogin)}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </>
        )}
    </div>
  )
}
