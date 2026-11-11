"use client"

import * as React from "react"
import { CheckIcon, LoaderCircleIcon, SearchCheckIcon, SendIcon, XIcon } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { useDecideDbsCheck, usePreviewDbsCheck, useSendDbsCheck } from "@/hooks/use-dbs-checks"
import type { DbsCheckDecision, DbsCheckPreview } from "@/lib/dbs-checks/schema"

/** TrustID, the certified identity provider, checked the evidence; uCheck may ask for a person instead. */
const DEFAULT_CHECKED_BY = "TRUSTID"

const text = (value: unknown) => (typeof value === "string" && value ? value : null)

/** The parts of the application an admin needs to recognise the teacher before paying for a check. */
function ApplicationSummary({ application }: { application: Record<string, unknown> }) {
  const address = (application.currentAddress ?? {}) as Record<string, unknown>
  const previous = Array.isArray(application.previousAddresses) ? application.previousAddresses.length : 0
  const name = [application.forename, ...(Array.isArray(application.middlenames) ? application.middlenames : []), application.surname]
    .map(text)
    .filter(Boolean)
    .join(" ")
  const rows: [string, string | null][] = [
    ["Name", name],
    ["Date of birth", text(application.dateOfBirth)],
    ["Current address", [address.line1, address.town, address.postcode].map(text).filter(Boolean).join(", ")],
    ["Living there since", text(address.from)],
    ["Previous addresses", previous ? String(previous) : "None needed (5 years at the current one)"],
    ["NI number", application.niNumber ? "Included" : "Not given"],
    ["Evidence checked by", text(application.evidenceCheckedBy)],
  ]

  return (
    <dl className="grid gap-2 rounded-lg bg-muted px-3 py-3 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-0.5">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd>{value || "—"}</dd>
        </div>
      ))}
    </dl>
  )
}

function PreviewResult({ preview }: { preview: DbsCheckPreview }) {
  return (
    <div className="flex flex-col gap-3">
      {preview.problems.length ? (
        <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p className="font-medium">This can&apos;t be sent yet:</p>
          <ul className="mt-1 list-disc pl-5">
            {preview.problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {preview.application ? <ApplicationSummary application={preview.application} /> : null}
      {preview.notes.length ? (
        <ul className="list-disc pl-5 text-sm text-muted-foreground">
          {preview.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * Sends the teacher's Enhanced DBS application to uCheck, built from the DBS
 * form they filled in on TrustID. Each application is charged, so the admin
 * checks it first; sending stays disabled until a check finds no problems.
 */
export function SendDbsCheckButton({
  identityCheckId,
  teacherName,
  label = "Send to uCheck",
}: {
  identityCheckId: string
  teacherName: string
  label?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [checkedBy, setCheckedBy] = React.useState(DEFAULT_CHECKED_BY)
  const [checkedFor, setCheckedFor] = React.useState<string | null>(null)
  const preview = usePreviewDbsCheck()
  const send = useSendDbsCheck()
  const inputId = React.useId()
  const input = { identityVerificationId: identityCheckId, evidenceCheckedBy: checkedBy.trim() }
  const previewIsCurrent = preview.data && checkedFor === input.evidenceCheckedBy
  const pending = preview.isPending || send.isPending

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      preview.reset()
      send.reset()
      setCheckedFor(null)
    }

    setOpen(nextOpen)
  }

  function check() {
    setCheckedFor(input.evidenceCheckedBy)
    preview.mutate(input)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <SendIcon data-icon="inline-start" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send {teacherName}&apos;s Enhanced DBS application?</DialogTitle>
          <DialogDescription>
            It is built from the DBS form the teacher filled in on TrustID, and tells uCheck their identity was verified.
            uCheck charges for each application (except on its test system), and the same identity check can only be sent
            once.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-1.5">
          <Label htmlFor={inputId}>Identity evidence checked by</Label>
          <Input
            id={inputId}
            maxLength={60}
            onChange={(event) => setCheckedBy(event.target.value)}
            value={checkedBy}
          />
          <p className="text-xs text-muted-foreground">
            TRUSTID, as TrustID checked the passport and selfie, unless uCheck asks for a person&apos;s name.
          </p>
        </div>
        {previewIsCurrent ? <PreviewResult preview={preview.data} /> : null}
        {preview.error || send.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {(send.error ?? preview.error)?.message}
          </p>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={pending}>Cancel</Button>
          </DialogClose>
          <Button variant="outline" disabled={pending || !input.evidenceCheckedBy} onClick={check}>
            {preview.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : <SearchCheckIcon data-icon="inline-start" />}
            {preview.isPending ? "Checking..." : "Check application"}
          </Button>
          <Button
            disabled={pending || !previewIsCurrent || !preview.data?.canSend}
            onClick={() => send.mutate(input, { onSuccess: () => setOpen(false) })}
          >
            {send.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {send.isPending ? "Sending..." : "Send to uCheck"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const decisionCopy: Record<
  DbsCheckDecision,
  { trigger: string; title: string; description: string; pending: string }
> = {
  APPROVED: {
    trigger: "Approve DBS",
    title: "Approve this DBS result?",
    description:
      "The teacher's DBS will count as verified. Only approve once you have seen the certificate the DBS posted to them.",
    pending: "Approving...",
  },
  REJECTED: {
    trigger: "Reject DBS",
    title: "Reject this DBS result?",
    description: "The teacher's DBS will not count as verified. They are not told why.",
    pending: "Rejecting...",
  },
}

/** Approve or reject a result whose certificate has content. The note stays with admins. */
export function DecideDbsCheckButton({ dbsCheckId, decision }: { dbsCheckId: string; decision: DbsCheckDecision }) {
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState("")
  const decide = useDecideDbsCheck()
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
            placeholder="What the certificate showed and why it is or isn't a concern"
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
            onClick={() => decide.mutate({ id: dbsCheckId, decision, note }, { onSuccess: () => setOpen(false) })}
          >
            {decide.isPending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
            {decide.isPending ? copy.pending : copy.trigger}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
