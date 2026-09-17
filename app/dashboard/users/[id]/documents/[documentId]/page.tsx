import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, EyeOffIcon, FileTextIcon } from "lucide-react"

import { DocumentStatusBadge } from "@/components/documents/document-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import {
  getDocumentReviews,
  getLatestDocumentReviewComment,
} from "@/lib/document-reviews/get-document-reviews"
import { formatMimeLabel } from "@/lib/document-types/presentation"
import { getDocument } from "@/lib/documents/get-document"
import {
  formatDocumentDate,
  formatDocumentFileSize,
  getDocumentCurrentFile,
  getDocumentDisplayName,
  getDocumentOwnerName,
  getDocumentStatusLabel,
  getDocumentTypeName,
} from "@/lib/documents/presentation"
import { isPreviewableDocumentContentType } from "@/lib/documents/preview"

type DocumentViewerPageProps = {
  params: Promise<{ id: string; documentId: string }>
  searchParams: Promise<{
    from?: string | string[]
    queuePage?: string | string[]
  }>
}

function ViewerLayout({
  backHref,
  backLabel,
  children,
}: {
  backHref: string
  backLabel: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href={backHref}>
            <ArrowLeftIcon data-icon="inline-start" />
            {backLabel}
          </Link>
        </Button>
      </div>
      {children}
    </div>
  )
}

function MessageCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default async function DocumentViewerPage({
  params,
  searchParams,
}: DocumentViewerPageProps) {
  const { id: userId, documentId } = await params
  const resolvedSearchParams = await searchParams
  const from = resolvedSearchParams.from
  const fromValue = Array.isArray(from) ? from[0] : from
  const fromQueue = fromValue === "queue"
  const fromUserDocuments = fromValue === "user-documents"
  const queuePageValue = Array.isArray(resolvedSearchParams.queuePage)
    ? resolvedSearchParams.queuePage[0]
    : resolvedSearchParams.queuePage
  const queuePage = Number(queuePageValue)
  const backHref = fromQueue
    ? `/dashboard/document-queue${Number.isInteger(queuePage) && queuePage > 1 ? `?page=${queuePage}` : ""}`
    : fromUserDocuments
      ? `/dashboard/users/${encodeURIComponent(userId)}?tab=documents`
      : `/dashboard/users/${encodeURIComponent(userId)}`
  const backLabel = fromQueue
    ? "Back to document queue"
    : fromUserDocuments
      ? "Back to documents"
      : "Back to user"
  const result = await getDocument(documentId)

  if (!result.ok) {
    return (
      <ViewerLayout backHref={backHref} backLabel={backLabel}>
        <MessageCard
          title="Unable to load document"
          description={result.message}
        />
      </ViewerLayout>
    )
  }

  const { document } = result

  // The route nests the document under its owner so the back link and the
  // revalidated paths line up. A document reached under someone else's ID is
  // treated as missing rather than rendered beneath the wrong user.
  if (document.userId !== userId) {
    return (
      <ViewerLayout backHref={backHref} backLabel={backLabel}>
        <MessageCard
          title="Document not found"
          description="This document does not belong to the selected user or is no longer available."
        />
      </ViewerLayout>
    )
  }

  const version = getDocumentCurrentFile(document)
  const displayName = getDocumentDisplayName(document)
  const canPreview = version
    ? isPreviewableDocumentContentType(version.contentType)
    : false
  const reviewsResult = await getDocumentReviews(document.id)
  const reviewComment = reviewsResult.ok
    ? getLatestDocumentReviewComment(reviewsResult.reviews)
    : null

  return (
    <ViewerLayout backHref={backHref} backLabel={backLabel}>
      <Card className="min-h-0 flex-1">
        <CardHeader className="border-b">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileTextIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle className="break-words">{displayName}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                <DocumentStatusBadge status={document.status} />
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  {getDocumentTypeName(document)}
                </span>
                {document.requirement ? (
                  <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                    {formatDocumentContext(document.requirement.context)}
                  </span>
                ) : null}
                {version ? (
                  <>
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {formatMimeLabel(version.contentType)}
                    </span>
                    <span>{formatDocumentFileSize(version.sizeBytes)}</span>
                    <span>Version {version.versionNumber}</span>
                    <span>Uploaded {formatDocumentDate(version.createdAt)}</span>
                    {version.documentExpiryDate ? (
                      <span>
                        Expires {formatDocumentDate(version.documentExpiryDate)}
                      </span>
                    ) : null}
                  </>
                ) : null}
              </CardDescription>
              <p className="mt-2 text-sm text-muted-foreground">
                Uploaded by{" "}
                <Link
                  href={`/dashboard/users/${encodeURIComponent(document.userId)}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {getDocumentOwnerName(document)}
                </Link>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          {canPreview ? (
            <iframe
              src={`/api/documents/${encodeURIComponent(document.id)}/content`}
              title={`Preview of ${displayName}`}
              className="h-[70vh] min-h-[24rem] w-full border-0 bg-muted/40 md:h-[calc(100vh-14rem)] md:min-h-[34rem]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex min-h-[34rem] flex-col items-center justify-center px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <EyeOffIcon className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-lg font-semibold">Preview unavailable</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {version
                  ? "This file format cannot be safely displayed in the browser. PDF, JPEG, and PNG files are supported."
                  : "No file has been uploaded for this document yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {reviewComment ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Review comment</CardTitle>
            <CardDescription>
              {getDocumentStatusLabel(reviewComment.toStatus)}
              {reviewComment.createdAt
                ? ` - ${formatDocumentDate(reviewComment.createdAt)}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {reviewComment.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </ViewerLayout>
  )
}
