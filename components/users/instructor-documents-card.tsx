"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  EyeIcon,
  FileTextIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DOCUMENT_REVIEW_STATUSES,
  type DocumentReviewStatus,
  type InstructorDocument,
} from "@/lib/documents/types"
import {
  getDocumentContentTypeLabel,
  getDocumentTypeLabel,
} from "@/lib/documents/presentation"
import { cn } from "@/lib/utils"

type InstructorDocumentsCardProps = {
  documents: InstructorDocument[]
  userId: string
}

const statusLabels: Record<DocumentReviewStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REQUIRES_INFO: "Requires information",
}

const statusClasses: Record<DocumentReviewStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  APPROVED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-destructive/10 text-destructive",
  REQUIRES_INFO: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
}

function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  const value = bytes / 1024 ** unitIndex

  return `${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(value)} ${units[unitIndex]}`
}

function formatDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function DocumentStatusBadge({
  status,
}: {
  status: DocumentReviewStatus
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-1 text-xs font-medium",
        statusClasses[status]
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

async function updateDocumentReview({
  documentId,
  userId,
  status,
  reviewNotes,
}: {
  documentId: string
  userId: string
  status: DocumentReviewStatus
  reviewNotes: string
}) {
  const response = await fetch(
    `/api/documents/${encodeURIComponent(documentId)}/review`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, status, reviewNotes }),
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
        : "Unable to update the document status."

    throw new Error(message)
  }
}

export function DocumentReviewDialog({
  document,
  userId,
}: {
  document: InstructorDocument
  userId: string
}) {
  const router = useRouter()
  const statusId = React.useId()
  const notesId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState<DocumentReviewStatus>(
    document.status
  )
  const [reviewNotes, setReviewNotes] = React.useState(
    document.reviewNotes ?? ""
  )
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (nextOpen) {
      setStatus(document.status)
      setReviewNotes(document.reviewNotes ?? "")
      setError(null)
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      try {
        await updateDocumentReview({
          documentId: document.id,
          userId,
          status,
          reviewNotes,
        })
        setOpen(false)
        router.refresh()
      } catch (reviewError) {
        setError(
          reviewError instanceof Error
            ? reviewError.message
            : "Unable to update the document status."
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={!document.uploadedAt}>
          <ShieldCheckIcon aria-hidden="true" />
          Review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Review document</DialogTitle>
            <DialogDescription>
              Update the verification status for {document.name}. Add a note
              when the instructor needs to take action.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={statusId}>
              Status
            </label>
            <select
              id={statusId}
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as DocumentReviewStatus)
              }
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {DOCUMENT_REVIEW_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {statusLabels[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor={notesId}>
              Review notes{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id={notesId}
              value={reviewNotes}
              onChange={(event) => setReviewNotes(event.target.value)}
              disabled={isPending}
              maxLength={1000}
              rows={4}
              placeholder="Explain why the document was rejected or what information is required."
              className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-xs text-muted-foreground">
              {reviewNotes.length}/1000 characters
            </p>
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
            <Button type="submit" disabled={isPending}>
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

export function InstructorDocumentsCard({
  documents,
  userId,
}: InstructorDocumentsCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Uploaded documents</CardTitle>
        <CardDescription>
          View instructor files and manage their verification status.
        </CardDescription>
        <CardAction>
          <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </span>
        </CardAction>
      </CardHeader>

      {documents.length === 0 ? (
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No documents uploaded</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This instructor has not uploaded any documents yet.
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-0">
          <Table className="min-w-[1080px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4" scope="col">
                  Document
                </TableHead>
                <TableHead scope="col">Document type</TableHead>
                <TableHead scope="col">File type</TableHead>
                <TableHead scope="col">Uploaded</TableHead>
                <TableHead scope="col">Expires</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead className="pr-4 text-right" scope="col">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="max-w-80 whitespace-normal pl-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileTextIcon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="break-words font-medium">{document.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatFileSize(document.sizeBytes)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getDocumentTypeLabel(document.type)}</TableCell>
                  <TableCell>
                    {getDocumentContentTypeLabel(document.contentType)}
                  </TableCell>
                  <TableCell>
                    {document.uploadedAt ? (
                      formatDate(document.uploadedAt)
                    ) : (
                      <span className="text-muted-foreground">Incomplete</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(document.expiresAt)}</TableCell>
                  <TableCell className="max-w-64 whitespace-normal">
                    <DocumentStatusBadge status={document.status} />
                    {document.reviewNotes ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {document.reviewNotes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex justify-end gap-2">
                      {document.uploadedAt ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/dashboard/users/${encodeURIComponent(userId)}/documents/${encodeURIComponent(document.id)}`}
                          >
                            <EyeIcon aria-hidden="true" />
                            View
                            <span className="sr-only"> {document.name}</span>
                          </Link>
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <EyeIcon aria-hidden="true" />
                          View
                        </Button>
                      )}
                      <DocumentReviewDialog
                        document={document}
                        userId={userId}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  )
}
