import { redirect } from "next/navigation"
import { ShieldCheckIcon, UserRoundIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getCurrentSession } from "@/lib/auth/session"

export default async function AccountSettingsPage() {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login?next=/dashboard/settings")
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your administrator profile and session security.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="border-b">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserRoundIcon className="size-4" aria-hidden="true" />
            </div>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your current account information.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Name
                </dt>
                <dd className="mt-1 font-medium">
                  {session.name?.trim() || "Administrator"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-muted-foreground">
                  Role
                </dt>
                <dd className="mt-1 font-medium">Administrator</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all">{session.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  User ID
                </dt>
                <dd className="mt-1 break-all font-mono text-xs">
                  {session.id}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheckIcon className="size-4" aria-hidden="true" />
            </div>
            <CardTitle>Session security</CardTitle>
            <CardDescription>
              Your admin session is protected by server-managed tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/60 p-4">
              <p className="font-medium">Secure session enabled</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Access and refresh tokens are stored in HttpOnly cookies and
                cannot be read by client-side JavaScript.
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Use the account menu in the header to securely sign out of this
              device.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
