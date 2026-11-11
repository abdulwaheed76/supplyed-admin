import { NextResponse } from "next/server"

import { dbsErrorResponse } from "@/lib/dbs-checks/forward-dbs-check-request"
import { getDbsReportUrl } from "@/lib/dbs-checks/get-dbs-report-url"

type ReportRouteContext = {
  params: Promise<{ id: string }>
}

/** Redirects to a short-lived presigned URL for uCheck's PDF result report. */
export async function GET(_request: Request, { params }: ReportRouteContext) {
  const result = await getDbsReportUrl((await params).id)

  if (!result.ok) {
    return dbsErrorResponse(result.message, result.status)
  }

  const redirect = NextResponse.redirect(result.reportUrl)
  redirect.headers.set("Cache-Control", "private, no-store")

  return redirect
}
