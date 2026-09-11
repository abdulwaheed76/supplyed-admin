"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon, Trash2Icon } from "lucide-react"

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
import { useDeleteUser } from "@/hooks/use-users"
import { getUserDisplayName } from "@/lib/users/presentation"
import type { UserListItem } from "@/lib/users/schema"

type DeleteUserButtonProps = {
  user: UserListItem
  /** The signed-in admin. Their own account gets a disabled control. */
  currentUserId?: string
  /** Where to go once the user is gone, e.g. off the deleted user's own page. */
  redirectTo?: string
  variant?: "icon" | "text"
}

export function DeleteUserButton({
  user,
  currentUserId,
  redirectTo,
  variant = "icon",
}: DeleteUserButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const deleteUser = useDeleteUser()
  const isPending = deleteUser.isPending
  const displayName = getUserDisplayName(user)
  const isSelf = user.id === currentUserId

  function handleOpenChange(open: boolean) {
    // Clear a previous failure so reopening the dialog does not show a stale
    // message from the last attempt.
    if (!open) {
      deleteUser.reset()
    }

    setIsOpen(open)
  }

  function handleDelete() {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        setIsOpen(false)

        // `replace`, not `push`: the page being left no longer exists, so
        // the back button should not return to it.
        if (redirectTo) {
          router.replace(redirectTo)
        }
      },
    })
  }

  const accessibleLabel = isSelf
    ? "You cannot delete your own account"
    : `Delete ${displayName}`

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={isSelf}
          >
            <Trash2Icon aria-hidden="true" />
            <span className="sr-only">{accessibleLabel}</span>
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-destructive hover:text-destructive"
            disabled={isSelf}
          >
            <Trash2Icon data-icon="inline-start" />
            Delete user
            {isSelf ? (
              <span className="sr-only"> (you cannot delete your own account)</span>
            ) : null}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {displayName}?</DialogTitle>
          <DialogDescription>
            This permanently deletes {user.email}, including their profile,
            applications, and sign-in records.
            {user.role === "ADMIN" ? " This account is an administrator." : ""}{" "}
            A user who still owns jobs, documents, or document reviews cannot
            be deleted.
          </DialogDescription>
        </DialogHeader>

        {deleteUser.error ? (
          <p role="alert" className="text-sm text-destructive">
            {deleteUser.error.message}
          </p>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Deleting…" : "Delete user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
