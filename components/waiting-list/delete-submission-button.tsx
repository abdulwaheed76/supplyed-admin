"use client"

import * as React from "react"
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
import { useDeleteSubmission } from "@/hooks/use-waiting-list"
import type { WaitingListSubmission } from "@/lib/waiting-list/schema"

export function DeleteSubmissionButton({
  submission,
}: {
  submission: WaitingListSubmission
}) {
  const [isOpen, setIsOpen] = React.useState(false)
  const deleteSubmission = useDeleteSubmission()
  const isPending = deleteSubmission.isPending

  function handleOpenChange(open: boolean) {
    if (isPending) return

    // Clear a previous failure so reopening the dialog does not show a stale
    // message from the last attempt.
    if (!open) {
      deleteSubmission.reset()
    }

    setIsOpen(open)
  }

  function handleDelete() {
    deleteSubmission.mutate(submission.id, {
      onSuccess: () => setIsOpen(false),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon aria-hidden="true" />
          <span className="sr-only">Delete {submission.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {submission.name}?</DialogTitle>
          <DialogDescription>
            This permanently removes {submission.email} from the waiting list.
            It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {deleteSubmission.error ? (
          <p role="alert" className="text-sm text-destructive">
            {deleteSubmission.error.message}
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
            {isPending ? "Deleting…" : "Delete submission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
