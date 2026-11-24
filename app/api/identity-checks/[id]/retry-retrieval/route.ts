import type { NextRequest } from "next/server"

import { forwardIdentityCheckAction } from "@/lib/identity-checks/forward-identity-check-action"

type RetryRetrievalRouteContext = {
  params: Promise<{ id: string }>
}

/** Forwards to `POST /identity-verification/admin/:id/retry-retrieval` after TrustID results failed to download. */
export async function POST(request: NextRequest, { params }: RetryRetrievalRouteContext) {
  return forwardIdentityCheckAction(request, (await params).id, {
    action: "retry-retrieval",
    fallbackMessage: "Unable to retry fetching the TrustID results.",
  })
}
