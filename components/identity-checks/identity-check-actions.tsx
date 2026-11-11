"use client"

import * as React from "react"
import { CheckIcon, LoaderCircleIcon, RefreshCwIcon, SendIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  useDecideIdentityCheck,
  useReissueIdentityCheck,
  useRetryIdentityCheckRetrieval,
} from "@/hooks/use-identity-checks"
import type { IdentityCheckDecision } from "@/lib/identity-checks/schema"

const decisionCopy: Record<
  IdentityCheckDecision,
  { trigger: string; title: string; description: string; confirm: string; pending: string }
> = {
  APPROVED: {
    trigger: "Approve identity",
    title: "Approve this identity check?",
    description:
      "The teacher's identity and right to work will count as verified, and they can send their profile for review. They will be told.",
    confirm: "Approve identity",
    pending: "Approving...",
  },
  REJECTED: {
    trigger: "Reject identity",
    title: "Reject this identity check?",
    description:
      "The teacher will be told their identity could not be verified and asked to contact support. They are not told why. You can still send them a new link later.",
    confirm: "Reject identity",
    pending: "Rejecting...",
  },
}

/** Approve or reject a check TrustID referred to us. The note is kept for admins only. */
export function DecideIdentityCheckButton({
  checkId,
  decision,
}: {
  checkId: string
  decision: IdentityCheckDecision
}) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const decide = useDecideIdentityCheck()
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
            placeholder="What you checked in the TrustID report"
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
            {decide.isPending ? copy.pending : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Sending a new link spends a TrustID credit once the teacher uses it, deletes
 * any link they still hold and closes a check still waiting for a decision,
 * so it is confirmed in a dialog.
 */
export function ReissueIdentityCheckButton({
  checkId,
  teacherName,
  hasLiveLink,
  needsDecision = false,
}: {
  checkId: string
  teacherName: string
  hasLiveLink: boolean
  needsDecision?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const reissue = useReissueIdentityCheck()

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      reissue.reset()
    }

    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <SendIcon data-icon="inline-start" />
          Send new link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send a new TrustID link?</DialogTitle>
          <DialogDescription>
            {teacherName} will be emailed and texted a new link to verify their identity and right to work.
            {hasLiveLink ? " The link they have now will stop working." : ""}
            {needsDecision ? " This check will be closed without approving it; the new one replaces it." : ""}
          </DialogDescription>
        </DialogHeader>
        {reissue.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {reissue.error.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={reissue.isPending}>Cancel</Button>
          </DialogClose>
          <Button
            disabled={reissue.isPending}
            onClick={() => reissue.mutate(checkId, { onSuccess: () => setOpen(false) })}
          >
            {reissue.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {reissue.isPending ? "Sending..." : "Send new link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function RetryIdentityCheckRetrievalButton({ checkId }: { checkId: string }) {
  const retry = useRetryIdentityCheckRetrieval()

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => retry.mutate(checkId)}>
        {retry.isPending ? (
          <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
        ) : (
          <RefreshCwIcon data-icon="inline-start" />
        )}
        {retry.isPending ? "Retrying..." : "Retry fetching results"}
      </Button>
      {retry.error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {retry.error.message}
        </p>
      ) : null}
    </div>
  )
}
