import Link from "next/link"
import { ArrowLeftIcon, EyeOffIcon, FileTextIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getInstructorDocuments } from "@/lib/documents/get-instructor-documents"
import {
  getDocumentContentTypeLabel,
  getDocumentTypeLabel,
} from "@/lib/documents/presentation"
import { isPreviewableDocumentContentType } from "@/lib/documents/preview"

type DocumentViewerPageProps = {
  params: Promise<{ id: string; documentId: string }>
  searchParams: Promise<{
    from?: string | string[]
    queuePage?: string | string[]
  }>
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

export default async function DocumentViewerPage({
  params,
  searchParams,
}: DocumentViewerPageProps) {
  const { id: userId, documentId } = await params
  const resolvedSearchParams = await searchParams
  const from = resolvedSearchParams.from
  const fromQueue = (Array.isArray(from) ? from[0] : from) === "queue"
  const queuePageValue = Array.isArray(resolvedSearchParams.queuePage)
    ? resolvedSearchParams.queuePage[0]
    : resolvedSearchParams.queuePage
  const queuePage = Number(queuePageValue)
  const result = await getInstructorDocuments(userId)
  const backHref = fromQueue
    ? `/dashboard/document-queue${Number.isInteger(queuePage) && queuePage > 1 ? `?page=${queuePage}` : ""}`
    : `/dashboard/users/${encodeURIComponent(userId)}`
  const backLabel = fromQueue ? "Back to document queue" : "Back to instructor"

  if (!result.ok) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <Button asChild size="sm" variant="ghost" className="-ml-2">
            <Link href={backHref}>
              <ArrowLeftIcon data-icon="inline-start" />
              {backLabel}
            </Link>
          </Button>
        </div>
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load document</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const document = result.documents.find((item) => item.id === documentId)

  if (!document) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <Button asChild size="sm" variant="ghost" className="-ml-2">
            <Link href={backHref}>
              <ArrowLeftIcon data-icon="inline-start" />
              {backLabel}
            </Link>
          </Button>
        </div>
        <Card role="alert">
          <CardHeader>
            <CardTitle>Document not found</CardTitle>
            <CardDescription>
              This document does not belong to the selected instructor or is
              no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const canPreview =
    Boolean(document.uploadedAt) &&
    isPreviewableDocumentContentType(document.contentType)

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

      <Card className="min-h-0 flex-1">
        <CardHeader className="border-b">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileTextIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <CardTitle className="break-words">{document.name}</CardTitle>
              <CardDescription className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Document type: {getDocumentTypeLabel(document.type)}
                </span>
                <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                  File type:{" "}
                  {getDocumentContentTypeLabel(document.contentType)}
                </span>
                <span>{formatFileSize(document.sizeBytes)}</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 p-0">
          {canPreview ? (
            <iframe
              src={`/api/documents/${encodeURIComponent(document.id)}/content`}
              title={`Preview of ${document.name}`}
              className="h-[calc(100vh-14rem)] min-h-[34rem] w-full border-0 bg-muted/40"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex min-h-[34rem] flex-col items-center justify-center px-6 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <EyeOffIcon className="size-5" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-lg font-semibold">Preview unavailable</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {document.uploadedAt
                  ? "This file format cannot be safely displayed in the browser. PDF, JPEG, and PNG files are supported."
                  : "The upload has not been completed, so this document cannot be viewed yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
