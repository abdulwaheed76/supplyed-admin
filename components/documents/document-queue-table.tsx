"use client"

import * as React from "react"
import Link from "next/link"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  FileTextIcon,
} from "lucide-react"

import { DocumentReviewDialog } from "@/components/documents/document-review-dialog"
import { DocumentStatusBadge } from "@/components/documents/document-status-badge"
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
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import { formatMimeLabel } from "@/lib/document-types/presentation"
import {
  formatDocumentDate,
  formatDocumentFileSize,
  getDocumentDisplayName,
  getDocumentOwnerName,
  getDocumentStatusLabel,
  getDocumentTypeName,
} from "@/lib/documents/presentation"
import {
  DOCUMENT_VERIFICATION_STATUSES,
  type DocumentRecord,
  type DocumentsPagination,
  type DocumentVerificationStatus,
} from "@/lib/documents/schema"

type DocumentQueueTableProps = {
  documents: DocumentRecord[]
  pagination: DocumentsPagination
}

type StatusFilter = "ALL" | DocumentVerificationStatus

function getStatusFilterLabel(filter: StatusFilter) {
  return filter === "ALL" ? "All statuses" : getDocumentStatusLabel(filter)
}

export function DocumentQueueTable({
  documents,
  pagination,
}: DocumentQueueTableProps) {
  const filterId = React.useId()
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL")
  // `GET /documents/admin` accepts a `status` query parameter but does not
  // apply it yet, so this filter can only narrow the page already fetched.
  const filteredDocuments = React.useMemo(
    () =>
      statusFilter === "ALL"
        ? documents
        : documents.filter((document) => document.status === statusFilter),
    [documents, statusFilter]
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>All documents</CardTitle>
        <CardDescription>
          Showing {filteredDocuments.length} of {documents.length} documents
          on this page. {pagination.total} total.
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
            {DOCUMENT_VERIFICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getDocumentStatusLabel(status)}
              </option>
            ))}
          </select>
        </CardAction>
      </CardHeader>

      {filteredDocuments.length === 0 ? (
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No documents found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {documents.length === 0
              ? "No documents have been created yet."
              : `No documents on this page are marked "${getStatusFilterLabel(statusFilter)}".`}
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-0">
          <Table className="min-w-[1280px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4 md:pl-6" scope="col">
                  Owner
                </TableHead>
                <TableHead scope="col">Document</TableHead>
                <TableHead scope="col">Document type</TableHead>
                <TableHead scope="col">Context</TableHead>
                <TableHead scope="col">File type</TableHead>
                <TableHead scope="col">Uploaded</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead className="pr-4 text-right md:pr-6" scope="col">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => {
                const version = document.currentVersion
                const owner = document.user
                const ownerHref = `/dashboard/users/${encodeURIComponent(document.userId)}`
                const displayName = getDocumentDisplayName(document)

                return (
                  <TableRow key={document.id}>
                    <TableCell className="pl-4 md:pl-6">
                      <Link
                        href={ownerHref}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {getDocumentOwnerName(document)}
                      </Link>
                      {owner?.name?.trim() ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {owner.email}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal">
                      {version ? (
                        <>
                          <p className="break-words font-medium">{displayName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatDocumentFileSize(version.sizeBytes)} · Version{" "}
                            {version.versionNumber}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          No file uploaded
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getDocumentTypeName(document)}</TableCell>
                    <TableCell>
                      {document.requirement
                        ? formatDocumentContext(document.requirement.context)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {version ? formatMimeLabel(version.contentType) : "—"}
                    </TableCell>
                    <TableCell>
                      {version ? (
                        formatDocumentDate(version.createdAt)
                      ) : (
                        <span className="text-muted-foreground">
                          Awaiting upload
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={document.status} />
                    </TableCell>
                    <TableCell className="pr-4 md:pr-6">
                      <div className="flex justify-end gap-2">
                        {version ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link
                              href={`${ownerHref}/documents/${encodeURIComponent(document.id)}?from=queue&queuePage=${pagination.page}`}
                            >
                              <EyeIcon aria-hidden="true" />
                              View
                              <span className="sr-only"> {displayName}</span>
                            </Link>
                          </Button>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>
                            <EyeIcon aria-hidden="true" />
                            View
                          </Button>
                        )}
                        <DocumentReviewDialog document={document} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
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
