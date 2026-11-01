import { NextResponse } from "next/server"
import {
  PREVIEW_HTML_CSP,
  renderPreviewError,
} from "@/lib/documents/word-preview"

import { getDocumentDownloadUrl } from "@/lib/documents/get-document-download-url"
import {
  isPreviewableDocumentContentType,
  isWordDocumentContentType,
  normalizeDocumentContentType,
} from "@/lib/documents/preview"

export const runtime = "nodejs"

type DocumentContentRouteContext = {
  params: Promise<{ id: string }>
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  )
}

function copyHeader(source: Headers, destination: Headers, headerName: string) {
  const value = source.get(headerName)

  if (value) {
    destination.set(headerName, value)
  }
}

export async function GET(
  request: Request,
  { params }: DocumentContentRouteContext,
) {
  const download = new URL(request.url).searchParams.get("download") === "1"
  const range = request.headers.get("range")

  if (range && !/^bytes=\d*-\d*$/.test(range)) {
    return errorResponse("The requested document range is invalid.", 416)
  }

  const result = await getDocumentDownloadUrl((await params).id)

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  let documentResponse: Response

  try {
    documentResponse = await fetch(result.downloadUrl, {
      headers: range ? { Range: range } : undefined,
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(15_000)]),
    })
  } catch {
    return errorResponse("The document storage service is unavailable.", 503)
  }

  if (!documentResponse.ok) {
    return errorResponse(
      "The document could not be loaded from storage.",
      documentResponse.status,
    )
  }

  const storedContentType = normalizeDocumentContentType(
    documentResponse.headers.get("content-type") ?? "",
  )

  const contentType =
    !storedContentType || storedContentType === "application/octet-stream"
      ? normalizeDocumentContentType(result.contentType || storedContentType)
      : storedContentType

  if (download) {
    const filename = (result.originalName || "document").replace(
      /[^a-zA-Z0-9._ -]/g,
      "_",
    )
    const headers = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    })
    for (const name of ["accept-ranges", "content-length", "content-range"])
      copyHeader(documentResponse.headers, headers, name)
    return new Response(documentResponse.body, {
      status: documentResponse.status,
      headers,
    })
  }

  if (isWordDocumentContentType(contentType)) {
    await documentResponse.body?.cancel()
    return new Response(renderPreviewError("Download this Word document to open it. Inline Word previews are unavailable."), {
      status: 415, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store",
        "Content-Security-Policy": PREVIEW_HTML_CSP, "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN" },
    })
  }

  if (!isPreviewableDocumentContentType(contentType)) {
    await documentResponse.body?.cancel()

    return errorResponse(
      "This file type cannot be safely previewed in the browser.",
      415,
    )
  }

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Disposition": "inline",
    "Content-Type": contentType,
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
  })

  copyHeader(documentResponse.headers, headers, "accept-ranges")
  copyHeader(documentResponse.headers, headers, "content-length")
  copyHeader(documentResponse.headers, headers, "content-range")

  return new Response(documentResponse.body, {
    status: documentResponse.status,
    headers,
  })
}
