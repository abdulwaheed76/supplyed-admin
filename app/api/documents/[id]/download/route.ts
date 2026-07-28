import { NextResponse } from "next/server"

import { getDocumentDownloadUrl } from "@/lib/documents/get-document-download-url"

type DownloadRouteContext = {
  params: Promise<{ id: string }>
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

export async function GET(
  _request: Request,
  { params }: DownloadRouteContext
) {
  const result = await getDocumentDownloadUrl((await params).id)

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  const redirect = NextResponse.redirect(result.downloadUrl)
  redirect.headers.set("Cache-Control", "private, no-store")

  return redirect
}
