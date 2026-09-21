"use client"

import * as React from "react"
import { LoaderCircleIcon, ShieldCheckIcon } from "lucide-react"

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
import { useReviewDocument } from "@/hooks/use-documents"
import {
  getDocumentCurrentFile,
  getDocumentDisplayName,
  getDocumentStatusLabel,
} from "@/lib/documents/presentation"
import {
  DOCUMENT_REVIEW_DECISIONS,
  type DocumentRecord,
  type DocumentReviewDecision,
} from "@/lib/documents/schema"

const NOTES_MAX_LENGTH = 2000

type DocumentReviewDialogProps = {
  document: DocumentRecord
}

export function DocumentReviewDialog({ document }: DocumentReviewDialogProps) {
  const decisionId = React.useId()
  const notesId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [decision, setDecision] = React.useState<DocumentReviewDecision | "">(
    ""
  )
  const [notes, setNotes] = React.useState("")
  const reviewDocument = useReviewDocument()
  const isPending = reviewDocument.isPending
  const notesRequired = decision === "REJECTED" || decision === "REQUIRES_INFO"
  const displayName = getDocumentDisplayName(document)
  const currentFile = getDocumentCurrentFile(document)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      // Reviews are an append-only log on the backend, so the previous note
      // is not on the document. Every review starts blank, with no decision
      // preselected, so an outcome is always a deliberate choice.
      setDecision("")
      setNotes("")
    } else {
      // Clear a previous failure so reopening the dialog does not show a
      // stale message from the last attempt.
      reviewDocument.reset()
    }

    setOpen(nextOpen)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!decision) {
      return
    }

    reviewDocument.mutate(
      { id: document.id, input: { status: decision, notes } },
      { onSuccess: () => setOpen(false) }
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {/* A document with no file has nothing to review yet. */}
        <Button size="sm" variant="outline" disabled={!currentFile}>
          <ShieldCheckIcon aria-hidden="true" />
          Review
          <span className="sr-only"> {displayName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Review document</DialogTitle>
            <DialogDescription>
              Decide the verification outcome for {displayName}. It is
              currently {getDocumentStatusLabel(document.status).toLowerCase()}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={decisionId}>Decision</Label>
            <select
              id={decisionId}
              value={decision}
              required
              onChange={(event) =>
                setDecision(event.target.value as DocumentReviewDecision | "")
              }
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Choose a decision
              </option>
              {DOCUMENT_REVIEW_DECISIONS.map((option) => (
                <option key={option} value={option}>
                  {getDocumentStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={notesId}>
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                {notesRequired ? "(required)" : "(optional)"}
              </span>
            </Label>
            <Textarea
              id={notesId}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={isPending}
              required={notesRequired}
              maxLength={NOTES_MAX_LENGTH}
              rows={4}
              placeholder="Explain why the document was rejected or what information is required."
            />
            <p className="text-xs text-muted-foreground">
              Emailed to the document owner. {notes.length}/{NOTES_MAX_LENGTH}{" "}
              characters.
            </p>
          </div>

          {reviewDocument.error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {reviewDocument.error.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !decision}>
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? "Saving…" : "Save review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
