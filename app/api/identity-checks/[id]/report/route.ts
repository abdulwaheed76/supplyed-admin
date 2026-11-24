import { NextResponse } from "next/server"

import { getIdentityReportUrl } from "@/lib/identity-checks/get-identity-report-url"

type ReportRouteContext = {
  params: Promise<{ id: string }>
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } }
  )
}

/** Redirects to a short-lived presigned URL for TrustID's PDF report. */
export async function GET(_request: Request, { params }: ReportRouteContext) {
  const result = await getIdentityReportUrl((await params).id)

  if (!result.ok) {
    return errorResponse(result.message, result.status)
  }

  const redirect = NextResponse.redirect(result.reportUrl)
  redirect.headers.set("Cache-Control", "private, no-store")

  return redirect
}
