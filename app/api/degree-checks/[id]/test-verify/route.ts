import type { NextRequest } from "next/server"

import { forwardDegreeCheckAction } from "@/lib/degree-checks/forward-degree-check-action"

/**
 * Forwards to `POST /degree-checks/admin/:id/test-verify`, which marks the
 * degree verified without Hedd. The backend refuses it unless
 * TEST_VERIFICATION_ENABLED is on (dev only).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return forwardDegreeCheckAction(request, (await params).id, {
    action: "test-verify",
    body: {},
    fallbackMessage: "Unable to mark the degree verified.",
  })
}
