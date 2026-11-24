"use client"

import * as React from "react"
import { BadgeCheckIcon, BanIcon, CheckIcon, LoaderCircleIcon, XIcon } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCancelDegreeCheck, useDecideDegreeCheck, useMarkDegreeVerifiedForTesting } from "@/hooks/use-degree-checks"
import type { DegreeCheckDecision } from "@/lib/degree-checks/schema"

const decisionCopy: Record<
  DegreeCheckDecision,
  { trigger: string; title: string; description: string; pending: string }
> = {
  APPROVED: {
    trigger: "Approve degree",
    title: "Approve this degree?",
    description:
      "Schools will see it as verified, with the university's corrected values. Compare what the teacher entered with the corrections first.",
    pending: "Approving...",
  },
  REJECTED: {
    trigger: "Reject degree",
    title: "Reject this degree?",
    description: "Schools won't see a verified degree. The teacher can start a new check, and isn't told your note.",
    pending: "Rejecting...",
  },
}

/** A decision is opened, noted and confirmed in a dialog; the note stays with admins. */
export function DecideDegreeCheckButton({ checkId, decision }: { checkId: string; decision: DegreeCheckDecision }) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const decide = useDecideDegreeCheck()
  const copy = decisionCopy[decision]
  const noteId = React.useId()

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      decide.reset()
      setNote("")
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={decision === "APPROVED" ? "default" : "destructive"}>
          {decision === "APPROVED" ? <CheckIcon data-icon="inline-start" /> : <XIcon data-icon="inline-start" />}
          {copy.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor={noteId}>Note for admins (optional)</Label>
          <Textarea
            id={noteId}
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Why the corrections do or don't matter"
            value={note}
          />
        </div>
        {decide.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {decide.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={decide.isPending}>Cancel</Button>
          </DialogClose>
          <Button
            disabled={decide.isPending}
            variant={decision === "APPROVED" ? "default" : "destructive"}
            onClick={() => decide.mutate({ id: checkId, decision, note }, { onSuccess: () => setOpen(false) })}
          >
            {decide.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {decide.isPending ? copy.pending : copy.trigger}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Testing only. The backend refuses it outside dev (TEST_VERIFICATION_ENABLED),
 * so in production this shows its error instead of skipping the university.
 */
export function TestVerifyDegreeCheckButton({ checkId }: { checkId: string }) {
  const [open, setOpen] = React.useState(false)
  const markVerified = useMarkDegreeVerifiedForTesting()

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      markVerified.reset()
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BadgeCheckIcon data-icon="inline-start" />
          Mark verified (testing)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark this degree verified?</DialogTitle>
          <DialogDescription>
            For testing only. The degree counts as verified by the university without corrections, as if Hedd had
            answered, and schools see it on the teacher&apos;s profile. This only works on the dev environment.
          </DialogDescription>
        </DialogHeader>
        {markVerified.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {markVerified.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={markVerified.isPending}>Cancel</Button>
          </DialogClose>
          <Button
            disabled={markVerified.isPending}
            onClick={() => markVerified.mutate(checkId, { onSuccess: () => setOpen(false) })}
          >
            {markVerified.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {markVerified.isPending ? "Marking..." : "Mark verified"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Closes a check whose sending Hedd never confirmed, so the teacher can start
 * again. Hedd may still have it, so the admin looks there first.
 */
export function CancelDegreeCheckButton({ checkId }: { checkId: string }) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const cancel = useCancelDegreeCheck()
  const noteId = React.useId()

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      cancel.reset()
      setNote("")
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <BanIcon data-icon="inline-start" />
          Cancel check
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this degree check?</DialogTitle>
          <DialogDescription>
            Hedd never confirmed it received this check. Look for reference {checkId} on the Hedd dashboard first: if
            Hedd has it, cancelling lets the teacher start a new check, which would be charged again. The note is shown
            to the teacher.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor={noteId}>Note for the teacher (optional)</Label>
          <Textarea
            id={noteId}
            maxLength={1000}
            onChange={(event) => setNote(event.target.value)}
            placeholder="For example: we couldn't send your check, please start it again"
            value={note}
          />
        </div>
        {cancel.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {cancel.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={cancel.isPending}>Keep it</Button>
          </DialogClose>
          <Button
            disabled={cancel.isPending}
            variant="destructive"
            onClick={() => cancel.mutate({ id: checkId, note }, { onSuccess: () => setOpen(false) })}
          >
            {cancel.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {cancel.isPending ? "Cancelling..." : "Cancel check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
