"use client"

import Link from "next/link"
import { DownloadIcon, EyeIcon, EyeOffIcon, FileTextIcon } from "lucide-react"

import { DocumentReviewDialog } from "@/components/documents/document-review-dialog"
import { DocumentStatusBadge } from "@/components/documents/document-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import type { DocumentReviewComment } from "@/lib/document-reviews/schema"
import { formatMimeLabel } from "@/lib/document-types/presentation"
import {
  formatDocumentDate,
  formatDocumentFileSize,
  getDocumentCurrentFile,
  getDocumentDisplayName,
  getDocumentStatusLabel,
  getDocumentTypeName,
} from "@/lib/documents/presentation"
import {
  isPreviewableDocumentContentType,
  normalizeDocumentContentType,
} from "@/lib/documents/preview"
import type { DocumentRecord } from "@/lib/documents/schema"

type UserDocumentsGridProps = {
  documents: DocumentRecord[]
  reviewComments: Record<string, DocumentReviewComment | null>
  userId: string
}

function getPreviewSrc(documentId: string, isPdf: boolean) {
  const base = `/api/documents/${encodeURIComponent(documentId)}/content`

  if (!isPdf) {
    return base
  }

  return `${base}#toolbar=0&navpanes=0&scrollbar=1`
}

export function UserDocumentsGrid({
  documents,
  reviewComments,
  userId,
}: UserDocumentsGridProps) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileTextIcon className="size-5" aria-hidden="true" />
          </span>
          <h2 className="mt-3 font-medium">No documents found</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            This user does not have any uploaded documents yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      {documents.map((document) => {
        const version = getDocumentCurrentFile(document)
        const displayName = getDocumentDisplayName(document)
        const contentType = version?.contentType ?? ""
        const normalizedContentType = normalizeDocumentContentType(contentType)
        const isPdf = normalizedContentType === "application/pdf"
        const canPreview = version
          ? isPreviewableDocumentContentType(contentType)
          : false
        const previewSrc = getPreviewSrc(document.id, isPdf)
        const reviewComment = reviewComments[document.id]

        return (
          <Card key={document.id} className="min-w-0 overflow-hidden">
            <CardHeader className="border-b">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="break-words text-base">
                    {displayName}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <DocumentStatusBadge status={document.status} />
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 font-medium text-foreground">
                      {getDocumentTypeName(document)}
                    </span>
                    {document.requirement ? (
                      <span className="inline-flex rounded-full bg-muted px-2 py-1 font-medium text-foreground">
                        {formatDocumentContext(document.requirement.context)}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="w-full sm:w-auto"
                >
                  <Link
                    href={`/dashboard/users/${encodeURIComponent(userId)}/documents/${encodeURIComponent(document.id)}?from=user-documents`}
                    aria-label={`Open full preview for ${displayName}`}
                  >
                    <EyeIcon aria-hidden="true" />
                    Open
                  </Link>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="relative h-[28rem] overflow-hidden bg-muted/40 sm:h-[34rem] xl:h-[36rem]">
                <div className="absolute inset-x-0 top-0 z-10 border-b bg-background/95 px-3 py-2 text-sm font-medium backdrop-blur">
                  <p className="truncate">{displayName}</p>
                </div>
                {canPreview ? (
                  <iframe
                    src={previewSrc}
                    title={`Preview of ${displayName}`}
                    className="h-full w-full border-0 pt-9"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 pt-9 text-center">
                    <span className="flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground">
                      <EyeOffIcon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-medium">Preview unavailable</h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      {version
                        ? "Download this file to view it in its original application."
                        : "No file has been uploaded for this document yet."}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{displayName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {version
                      ? `${formatMimeLabel(version.contentType)} - ${formatDocumentFileSize(version.sizeBytes)} - Uploaded ${formatDocumentDate(version.createdAt)}`
                      : "Awaiting upload"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {version ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={`/api/documents/${encodeURIComponent(document.id)}/content?download=1`}
                        download
                      >
                        <DownloadIcon aria-hidden="true" />
                        Download
                      </a>
                    </Button>
                  ) : null}
                  <DocumentReviewDialog document={document} />
                </div>
              </div>

              {reviewComment ? (
                <div className="break-words rounded-lg border bg-muted/40 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">
                    {getDocumentStatusLabel(reviewComment.toStatus)} comment
                    {reviewComment.createdAt
                      ? ` - ${formatDocumentDate(reviewComment.createdAt)}`
                      : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                    {reviewComment.notes}
                  </p>
                </div>
              ) : null}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
