import { NextResponse } from "next/server"

import { getConversationMessages } from "@/lib/conversations/get-conversations"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const query = new URL(request.url).searchParams
  const headers = { "Cache-Control": "private, no-store" }
  if ([...query.keys()].some((key) => key !== "before") || query.getAll("before").length > 1) {
    return NextResponse.json({ message: "The messages query is invalid." }, { status: 400, headers })
  }

  const result = await getConversationMessages((await params).id, query.get("before") ?? undefined)
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status, headers })
  }

  return NextResponse.json(result.data, { headers })
}
