import { NextResponse } from "next/server"

import { getAttachmentDownloadUrl } from "@/lib/conversations/get-attachment-download-url"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const { id, attachmentId } = await params
  const result = await getAttachmentDownloadUrl(id, attachmentId)
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" }
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers })
  }

  return NextResponse.redirect(result.data.url, { status: 307, headers })
}
