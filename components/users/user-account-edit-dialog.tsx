"use client"

import * as React from "react"
import { LoaderCircleIcon, PencilIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDisableUserTwoFactor, useUpdateUser } from "@/hooks/use-users"
import { formatUserRole } from "@/lib/users/presentation"
import type { UserListItem } from "@/lib/users/schema"
import { USER_ROLES, userRoleSchema } from "@/lib/users/roles"

type UserAccountEditDialogProps = {
  user: UserListItem
  currentUserId?: string
}

export function UserAccountEditDialog({ user, currentUserId }: UserAccountEditDialogProps) {
  const nameId = React.useId()
  const phoneId = React.useId()
  const roleId = React.useId()
  const emailVerifiedId = React.useId()
  const phoneVerifiedId = React.useId()
  const twoFactorId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(user.name ?? "")
  const [phone, setPhone] = React.useState(user.phone ?? "")
  const [role, setRole] = React.useState(user.role)
  const [emailVerified, setEmailVerified] = React.useState(user.emailVerified)
  const [phoneVerified, setPhoneVerified] = React.useState(user.phoneVerified ?? false)
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(user.twoFactorEnabled ?? false)
  const updateUser = useUpdateUser()
  const disableTwoFactor = useDisableUserTwoFactor()
  const isPending = updateUser.isPending || disableTwoFactor.isPending

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setName(user.name ?? "")
      setPhone(user.phone ?? "")
      setRole(user.role)
      setEmailVerified(user.emailVerified)
      setPhoneVerified(user.phoneVerified ?? false)
      setTwoFactorEnabled(user.twoFactorEnabled ?? false)
      updateUser.reset()
      disableTwoFactor.reset()
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateUser.mutate(
      {
        id: user.id,
        input: {
          name,
          phone,
          role: role === user.role ? undefined : userRoleSchema.parse(role),
          emailVerified: emailVerified === user.emailVerified ? undefined : emailVerified,
          phoneVerified: phoneVerified === (user.phoneVerified ?? false) ? undefined : phoneVerified,
        },
      },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PencilIcon aria-hidden="true" />
          Edit account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit account details</DialogTitle>
            <DialogDescription>
              Update the account details available through the admin user API.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={nameId}>Name</Label>
              <Input
                id={nameId}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isPending}
                maxLength={160}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={phoneId}>Phone number</Label>
              <Input
                id={phoneId}
                value={phone}
                onChange={(event) => { setPhone(event.target.value); if (event.target.value !== user.phone) setPhoneVerified(false) }}
                disabled={isPending}
                maxLength={40}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor={roleId}>Role</Label>
              <select
                id={roleId}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {!userRoleSchema.safeParse(user.role).success ? (
                  <option value={user.role} disabled>{formatUserRole(user.role)} (existing account)</option>
                ) : null}
                {USER_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {formatUserRole(option)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={emailVerifiedId}>Email status</Label>
              <select id={emailVerifiedId} value={String(emailVerified)} onChange={(event) => setEmailVerified(event.target.value === "true")}
                disabled={isPending} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="true">Verified</option><option value="false">Not verified</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor={phoneVerifiedId}>Phone status</Label>
              <select id={phoneVerifiedId} value={String(phoneVerified)} onChange={(event) => setPhoneVerified(event.target.value === "true")}
                disabled={isPending || !phone.trim()} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="true">Verified</option><option value="false">Not verified</option>
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor={twoFactorId}>Two-factor authentication</Label>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-input px-3 py-2">
                <div>
                  <p className="text-sm">{twoFactorEnabled ? "Enabled" : "Disabled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.id === currentUserId ? "Use your own settings and a code to disable 2FA." : "Admins can turn off 2FA. Only the user can set it up again."}
                  </p>
                </div>
                <button id={twoFactorId} type="button" role="switch" aria-checked={twoFactorEnabled}
                  aria-label="Two-factor authentication" disabled={!twoFactorEnabled || user.id === currentUserId || isPending}
                  onClick={() => disableTwoFactor.mutate(user.id, { onSuccess: () => setTwoFactorEnabled(false) })}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${twoFactorEnabled ? "bg-primary" : "bg-muted"}`}>
                  <span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${twoFactorEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Changing the phone number resets its verification status until you verify the new number.</p>

          {disableTwoFactor.error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {disableTwoFactor.error.message}
            </p>
          ) : null}

          {updateUser.error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {updateUser.error.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
