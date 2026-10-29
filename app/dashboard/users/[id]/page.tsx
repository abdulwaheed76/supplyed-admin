import Link from "next/link"
import { ArrowLeftIcon, FileTextIcon, UserRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DeleteUserButton } from "@/components/users/delete-user-button"
import { InstitutionProfileCard } from "@/components/users/institution-profile-card"
import { InstructorProfileCard } from "@/components/users/instructor-profile-card"
import { UserAccountEditDialog } from "@/components/users/user-account-edit-dialog"
import { UserDocumentsGrid } from "@/components/users/user-documents-grid"
import { VerifiedBadge } from "@/components/users/verified-badge"
import { getCurrentSession } from "@/lib/auth/session"
import {
  getUserDocuments,
  type GetUserDocumentsResult,
} from "@/lib/documents/get-user-documents"
import { getUser } from "@/lib/users/get-user"
import { getVerifiedUserIds } from "@/lib/users/get-verified-user-ids"
import type { UserListItem } from "@/lib/users/schema"
import {
  getRoleProfile,
  withRoleProfileName,
  type RoleProfileResult,
} from "@/lib/users/get-role-profile"
import {
  formatUserDate,
  formatUserDateTime,
  formatUserRole,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/users/presentation"

type UserDetailTab = "profile" | "documents"

type UserDetailsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    tab?: string | string[]
  }>
}

function getSelectedTab(searchParams: { tab?: string | string[] }) {
  const tab = Array.isArray(searchParams.tab)
    ? searchParams.tab[0]
    : searchParams.tab

  return tab === "documents" ? "documents" : "profile"
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

function UserDetailTabs({
  activeTab,
  userId,
}: {
  activeTab: UserDetailTab
  userId: string
}) {
  const baseHref = `/dashboard/users/${encodeURIComponent(userId)}`
  const tabs: Array<{
    value: UserDetailTab
    label: string
    href: string
    Icon: typeof UserRoundIcon
  }> = [
    {
      value: "profile",
      label: "Profile",
      href: baseHref,
      Icon: UserRoundIcon,
    },
    {
      value: "documents",
      label: "Documents",
      href: `${baseHref}?tab=documents`,
      Icon: FileTextIcon,
    },
  ]

  return (
    <div className="border-b">
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="User sections"
      >
        {tabs.map(({ value, label, href, Icon }) => {
          const active = activeTab === value

          return (
            <Button
              key={value}
              asChild
              size="sm"
              variant={active ? "default" : "ghost"}
            >
              <Link
                href={href}
                role="tab"
                aria-selected={active}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                {label}
              </Link>
            </Button>
          )
        })}
      </div>
    </div>
  )
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
    const profileTitle =
      result.kind === "instructor"
        ? "Instructor profile"
        : "Institution profile"

    return (
      <Card>
        <CardHeader>
          <CardTitle>{profileTitle}</CardTitle>
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

function ProfileTab({
  roleProfile,
  user,
  currentUserId,
}: {
  roleProfile: RoleProfileResult | null
  user: UserListItem
  currentUserId?: string
}) {
  const countryCode =
    roleProfile?.ok && roleProfile.kind !== "none"
      ? roleProfile.profile?.countryCode
      : user.countryCode

  return (
    <>
      <RoleProfileView result={roleProfile} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Profile information</CardTitle>
            <CardDescription>
              Account and contact information for this user.
            </CardDescription>
            <CardAction>
              <UserAccountEditDialog user={user} currentUserId={currentUserId} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Role
                </dt>
                <dd className="mt-1 font-medium">
                  {formatUserRole(user.role)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Phone
                </dt>
                <dd className="mt-1">{user.phone || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Country
                </dt>
                <dd className="mt-1">{countryCode || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Joined
                </dt>
                <dd className="mt-1">{formatUserDate(user.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Last updated
                </dt>
                <dd className="mt-1">{formatUserDate(user.updatedAt)}</dd>
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
                  <VerificationStatus verified={user.emailVerified} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Phone verification
                </dt>
                <dd className="mt-2">
                  <VerificationStatus verified={user.phoneVerified ?? false} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Two-factor authentication
                </dt>
                <dd className="mt-1 font-medium">
                  <BooleanStatus enabled={user.twoFactorEnabled ?? false} />
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Last login
                </dt>
                <dd className="mt-1">
                  {formatUserDateTime(user.lastLogin)}
                  {!user.lastLogin ? <p className="mt-1 text-xs text-muted-foreground">A timestamp will appear after their next successful sign-in.</p> : null}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function DocumentsTab({
  result,
  userId,
}: {
  result: GetUserDocumentsResult | null
  userId: string
}) {
  if (!result) {
    return null
  }

  if (!result.ok) {
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>Unable to load documents</CardTitle>
          <CardDescription>{result.message}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Showing {result.documents.length} document
            {result.documents.length === 1 ? "" : "s"} for this user.
          </p>
        </div>
      </div>
      <UserDocumentsGrid
        documents={result.documents}
        reviewComments={result.reviewComments}
        userId={userId}
      />
    </div>
  )
}

export default async function UserDetailsPage({
  params,
  searchParams,
}: UserDetailsPageProps) {
  const [{ id }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ])
  const activeTab = getSelectedTab(resolvedSearchParams)
  const [result, session] = await Promise.all([
    getUser(id),
    getCurrentSession(),
  ])

  let roleProfile: RoleProfileResult | null = null
  let documentsResult: GetUserDocumentsResult | null = null

  if (result.ok) {
    roleProfile = await getRoleProfile(result.user)
    result.user = withRoleProfileName(result.user, roleProfile)
    if (activeTab === "documents") {
      documentsResult = await getUserDocuments(result.user.id)
    }
  }

  const verifiedUserIds =
    result.ok && roleProfile?.ok && roleProfile.kind !== "none" && roleProfile.profile
      ? await getVerifiedUserIds(
          [{ ...result.user, profileStatus: roleProfile.profile.status }],
          documentsResult?.ok ? documentsResult.documents : undefined
        )
      : new Set<string>()

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
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {getUserDisplayName(result.user)}
                  </h1>
                  {verifiedUserIds.has(result.user.id) ? <VerifiedBadge /> : null}
                </div>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {result.user.email}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {formatUserRole(result.user.role)}
                  </span>
                  <VerificationStatus verified={result.user.emailVerified} />
                </div>
              </div>
              <DeleteUserButton
                user={result.user}
                currentUserId={session?.id}
                redirectTo="/dashboard/users"
                variant="text"
              />
            </CardContent>
          </Card>

          <UserDetailTabs activeTab={activeTab} userId={result.user.id} />

          {activeTab === "documents" ? (
            <DocumentsTab result={documentsResult} userId={result.user.id} />
          ) : (
            <ProfileTab roleProfile={roleProfile} user={result.user} currentUserId={session?.id} />
          )}
        </>
      )}
    </div>
  )
}
