import { NextResponse } from "next/server"

import { getDocumentDownloadUrl } from "@/lib/documents/get-document-download-url"
import {
  isPreviewableDocumentContentType,
  normalizeDocumentContentType,
} from "@/lib/documents/preview"

type DocumentContentRouteContext = {
  params: Promise<{ id: string }>
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

function copyHeader(
  source: Headers,
  destination: Headers,
  headerName: string
) {
  const value = source.get(headerName)

  if (value) {
    destination.set(headerName, value)
  }
}

export async function GET(
  request: Request,
  { params }: DocumentContentRouteContext
) {
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
      signal: request.signal,
    })
  } catch {
    return errorResponse("The document storage service is unavailable.", 503)
  }

  if (!documentResponse.ok) {
    return errorResponse(
      "The document could not be loaded from storage.",
      documentResponse.status
    )
  }

  const contentType = normalizeDocumentContentType(
    documentResponse.headers.get("content-type") ?? ""
  )

  if (!isPreviewableDocumentContentType(contentType)) {
    await documentResponse.body?.cancel()

    return errorResponse(
      "This file type cannot be safely previewed in the browser.",
      415
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
