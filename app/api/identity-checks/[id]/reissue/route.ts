import type { NextRequest } from "next/server"

import { forwardIdentityCheckAction } from "@/lib/identity-checks/forward-identity-check-action"

type ReissueRouteContext = {
  params: Promise<{ id: string }>
}

/**
 * Forwards to `POST /identity-verification/admin/:id/reissue`. The backend
 * deletes the teacher's live TrustID link first, then emails and texts a new
 * one, so this is a POST that creates a new check rather than an edit.
 */
export async function POST(request: NextRequest, { params }: ReissueRouteContext) {
  return forwardIdentityCheckAction(request, (await params).id, {
    action: "reissue",
    fallbackMessage: "Unable to send a new identity check link.",
  })
}
