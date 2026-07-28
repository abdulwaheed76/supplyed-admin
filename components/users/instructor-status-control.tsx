"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import {
  getAdminProfileStatusOptions,
  getProfileStatusLabel,
  type AdminProfileStatus,
  type ProfileStatus,
} from "@/lib/users/profile-status"
import { cn } from "@/lib/utils"

type InstructorStatusControlProps = {
  profileId: string
  userId: string
  currentStatus: ProfileStatus
}

type ProfileKind = "instructor" | "institution"

type ProfileStatusControlProps = InstructorStatusControlProps & {
  profileKind: ProfileKind
}

const statusClasses: Record<ProfileStatus, string> = {
  INCOMPLETE: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  ACTIVE: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  SUSPENDED: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  DEACTIVATED: "bg-muted text-muted-foreground",
  REJECTED: "bg-destructive/10 text-destructive",
}

async function updateProfileStatus({
  profileId,
  userId,
  status,
  profileKind,
}: {
  profileId: string
  userId: string
  status: AdminProfileStatus
  profileKind: ProfileKind
}) {
  const resource =
    profileKind === "instructor" ? "instructors" : "institutions"
  const response = await fetch(
    `/api/${resource}/${encodeURIComponent(profileId)}/status`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, status }),
    }
  )
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : `Unable to update the ${profileKind} profile status.`

    throw new Error(message)
  }
}

function ProfileStatusControl({
  profileId,
  userId,
  currentStatus,
  profileKind,
}: ProfileStatusControlProps) {
  const router = useRouter()
  const statusId = React.useId()
  const availableStatuses = getAdminProfileStatusOptions()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] =
    React.useState<AdminProfileStatus>(currentStatus)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setStatus(currentStatus)
      setError(null)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (status === currentStatus) {
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        await updateProfileStatus({ profileId, userId, status, profileKind })
        setOpen(false)
        router.refresh()
      } catch (statusError) {
        setError(
          statusError instanceof Error
            ? statusError.message
            : `Unable to update the ${profileKind} profile status.`
        )
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span
        className={cn(
          "inline-flex rounded-full px-2 py-1 text-xs font-medium",
          statusClasses[currentStatus]
        )}
      >
        {getProfileStatusLabel(currentStatus)}
      </span>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <PencilIcon aria-hidden="true" />
            Change status
          </Button>
        </DialogTrigger>
        <DialogContent>
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Update {profileKind} status</DialogTitle>
              <DialogDescription>
                The current profile status is{" "}
                <strong className="font-medium text-foreground">
                  {getProfileStatusLabel(currentStatus)}
                </strong>
                . Select any available profile status.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor={statusId}>
                New status
              </label>
              <select
                id={statusId}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AdminProfileStatus)
                }
                disabled={isPending}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {availableStatuses.map((option) => (
                  <option key={option} value={option}>
                    {getProfileStatusLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isPending || status === currentStatus}
              >
                {isPending ? (
                  <LoaderCircleIcon
                    className="animate-spin"
                    aria-hidden="true"
                  />
                ) : null}
                {isPending ? "Updating…" : "Update status"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function InstructorStatusControl(props: InstructorStatusControlProps) {
  return <ProfileStatusControl {...props} profileKind="instructor" />
}

export function InstitutionStatusControl(props: InstructorStatusControlProps) {
  return <ProfileStatusControl {...props} profileKind="institution" />
}
