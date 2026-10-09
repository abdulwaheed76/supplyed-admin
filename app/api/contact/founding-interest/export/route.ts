import { NextResponse } from "next/server"

import { getCurrentSession } from "@/lib/auth/session"
import { createWaitingListCsv } from "@/lib/waiting-list/csv"
import { getAllSubmissions } from "@/lib/waiting-list/get-submissions"

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

export async function GET() {
  const session = await getCurrentSession()

  if (!session) {
    return errorResponse("Your session has expired. Sign in again.", 401)
  }

  const result = await getAllSubmissions()

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  const date = new Date().toISOString().slice(0, 10)

  return new Response(createWaitingListCsv(result.submissions), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="supplyed-waiting-list-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  })
}
