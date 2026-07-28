"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DocumentReviewDialog,
  DocumentStatusBadge,
} from "@/components/users/instructor-documents-card"
import {
  getDocumentContentTypeLabel,
  getDocumentTypeLabel,
} from "@/lib/documents/presentation"
import {
  DOCUMENT_REVIEW_STATUSES,
  type DocumentQueueItem,
  type DocumentReviewStatus,
} from "@/lib/documents/types"

type DocumentQueueTableProps = {
  items: DocumentQueueItem[]
  pagination: {
    page: number
    total: number
    totalPages: number
    hasNextPage: boolean
  }
  unresolvedInstructorCount: number
}

type StatusFilter = "ALL" | DocumentReviewStatus

const statusLabels: Record<StatusFilter, string> = {
  ALL: "All statuses",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REQUIRES_INFO: "Requires information",
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

  return `${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(bytes / 1024 ** unitIndex)} ${units[unitIndex]}`
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

export function DocumentQueueTable({
  items,
  pagination,
  unresolvedInstructorCount,
}: DocumentQueueTableProps) {
  const filterId = React.useId()
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL")
  const filteredItems = React.useMemo(
    () =>
      statusFilter === "ALL"
        ? items
        : items.filter((item) => item.document.status === statusFilter),
    [items, statusFilter]
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>All documents</CardTitle>
        <CardDescription>
          Showing {filteredItems.length} of {items.length} documents on this
          page. {pagination.total} total.
        </CardDescription>
        <CardAction>
          <label className="sr-only" htmlFor={filterId}>
            Filter documents by status
          </label>
          <select
            id={filterId}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="ALL">All statuses</option>
            {DOCUMENT_REVIEW_STATUSES.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </CardAction>
      </CardHeader>

      {unresolvedInstructorCount > 0 ? (
        <div
          role="status"
          className="mx-4 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
        >
          <AlertTriangleIcon
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          Instructor details for {unresolvedInstructorCount} document
          {unresolvedInstructorCount === 1 ? "" : "s"} could not be resolved.
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No documents found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {items.length === 0
              ? "No instructors have uploaded documents yet."
              : `No documents have the ${statusLabels[statusFilter].toLowerCase()} status.`}
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-0">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 md:pl-6" scope="col">
                  Instructor
                </TableHead>
                <TableHead scope="col">Document</TableHead>
                <TableHead scope="col">Document type</TableHead>
                <TableHead scope="col">File type</TableHead>
                <TableHead scope="col">Uploaded</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead className="pr-4 text-right md:pr-6" scope="col">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(({ document, instructor }) => (
                <TableRow key={document.id}>
                  <TableCell className="pl-4 md:pl-6">
                    {instructor.userId ? (
                      <Link
                        href={`/dashboard/users/${encodeURIComponent(instructor.userId)}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {instructor.fullName}
                      </Link>
                    ) : (
                      <span className="font-medium text-muted-foreground">
                        {instructor.fullName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-72 whitespace-normal">
                    <p className="break-words font-medium">{document.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatFileSize(document.sizeBytes)}
                    </p>
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
                  <TableCell className="max-w-64 whitespace-normal">
                    <DocumentStatusBadge status={document.status} />
                    {document.reviewNotes ? (
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {document.reviewNotes}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-4 md:pr-6">
                    <div className="flex justify-end gap-2">
                      {document.uploadedAt && instructor.userId ? (
                        <Button asChild size="sm" variant="ghost">
                          <Link
                            href={`/dashboard/users/${encodeURIComponent(instructor.userId)}/documents/${encodeURIComponent(document.id)}?from=queue&queuePage=${pagination.page}`}
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
                      {instructor.userId ? (
                        <DocumentReviewDialog
                          document={document}
                          userId={instructor.userId}
                        />
                      ) : (
                        <Button size="sm" variant="outline" disabled>
                          <ShieldCheckIcon aria-hidden="true" />
                          Review
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
      <CardFooter className="flex-wrap justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex items-center gap-2">
          {pagination.page > 1 ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/document-queue?page=${pagination.page - 1}`}>
                <ChevronLeftIcon data-icon="inline-start" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Button>
          )}
          {pagination.hasNextPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/document-queue?page=${pagination.page + 1}`}>
                Next
                <ChevronRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
