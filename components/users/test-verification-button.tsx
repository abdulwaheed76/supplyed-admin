"use client"

import * as React from "react"
import { BadgeCheckIcon, LoaderCircleIcon } from "lucide-react"

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
import { useMarkTeacherVerifiedForTesting } from "@/hooks/use-identity-checks"

/**
 * Testing only. The backend refuses it outside dev (TEST_VERIFICATION_ENABLED),
 * so in production this shows its error instead of skipping real checks.
 */
export function TestVerificationButton({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const markVerified = useMarkTeacherVerifiedForTesting()
  const isPending = markVerified.isPending

  function handleOpenChange(open: boolean) {
    // A reopened dialog should not show the last attempt's error.
    if (!open) {
      markVerified.reset()
    }

    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BadgeCheckIcon data-icon="inline-start" />
          Mark verified (testing)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark this teacher verified?</DialogTitle>
          <DialogDescription>
            For testing only. The teacher passes the TrustID identity check and
            the DBS check without either really happening, and their profile
            becomes active. This only works on the dev environment.
          </DialogDescription>
        </DialogHeader>

        {markVerified.error ? (
          <p role="alert" className="text-sm text-destructive">
            {markVerified.error.message}
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
            onClick={() =>
              markVerified.mutate(userId, { onSuccess: () => setIsOpen(false) })
            }
            disabled={isPending}
          >
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Marking…" : "Mark verified"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
