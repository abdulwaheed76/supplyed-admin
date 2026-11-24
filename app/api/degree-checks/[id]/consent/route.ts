import { NextResponse } from "next/server"

import { degreeErrorResponse } from "@/lib/degree-checks/forward-degree-check-action"
import { getDegreeConsentUrl } from "@/lib/degree-checks/get-degree-consent-url"

type ConsentRouteContext = {
  params: Promise<{ id: string }>
}

/** Redirects to a short-lived presigned URL for the teacher's signed consent form. */
export async function GET(_request: Request, { params }: ConsentRouteContext) {
  const result = await getDegreeConsentUrl((await params).id)

  if (!result.ok) {
    return degreeErrorResponse(result.message, result.status)
  }

  const redirect = NextResponse.redirect(result.consentUrl)
  redirect.headers.set("Cache-Control", "private, no-store")

  return redirect
}
