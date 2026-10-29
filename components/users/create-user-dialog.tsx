"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, UserPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateUser } from "@/hooks/use-users"
import { CREATE_USER_ROLES, createUserRoleSchema } from "@/lib/users/roles"
import { formatUserRole } from "@/lib/users/presentation"

export function CreateUserDialog() {
  const [open, setOpen] = React.useState(false)
  const createUser = useCreateUser()
  const router = useRouter()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()
    createUser.mutate({
      role: createUserRoleSchema.parse(form.get("role")),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? ""),
      name: name || undefined,
      phone: phone || undefined,
      emailVerified: form.get("emailVerified") === "on",
      phoneVerified: form.get("phoneVerified") === "on",
    }, {
      onSuccess: (user) => {
        setOpen(false)
        router.push(`/dashboard/users/${encodeURIComponent(user.id)}`)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (nextOpen) createUser.reset() }}>
      <DialogTrigger asChild>
        <Button><UserPlusIcon aria-hidden="true" />Create user</Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>Choose an instructor or institution account. They can complete their profile later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="new-user-role">Role</Label>
              <select id="new-user-role" name="role" defaultValue="INSTRUCTOR" required disabled={createUser.isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">
                {CREATE_USER_ROLES.map((role) => <option key={role} value={role}>{formatUserRole(role)}</option>)}
              </select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" name="email" type="email" required maxLength={254} autoComplete="off" disabled={createUser.isPending} />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="new-user-password">Temporary password</Label>
              <Input id="new-user-password" name="password" type="password" required minLength={8} autoComplete="new-password" disabled={createUser.isPending} />
              <p className="text-xs text-muted-foreground">Use an uppercase letter, a number, and a special character.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-name">Name</Label>
              <Input id="new-user-name" name="name" maxLength={200} disabled={createUser.isPending} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-phone">Phone number</Label>
              <Input id="new-user-phone" name="phone" type="tel" maxLength={30} disabled={createUser.isPending} />
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="emailVerified" disabled={createUser.isPending} />Email verified</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="phoneVerified" disabled={createUser.isPending} />Phone verified</label>
          </div>
          {createUser.error ? <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{createUser.error.message}</p> : null}
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline" disabled={createUser.isPending}>Cancel</Button></DialogClose>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? <LoaderCircleIcon className="animate-spin" aria-hidden="true" /> : null}
              {createUser.isPending ? "Creating..." : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
