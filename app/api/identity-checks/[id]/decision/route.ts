import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { forwardIdentityCheckAction } from "@/lib/identity-checks/forward-identity-check-action"
import { identityCheckDecisionSchema } from "@/lib/identity-checks/schema"

type DecisionRouteContext = {
  params: Promise<{ id: string }>
}

const decisionBodySchema = z.object({
  decision: identityCheckDecisionSchema,
  note: z.string().trim().max(1000).optional(),
})

/**
 * Forwards to `POST /identity-verification/admin/:id/decision`. Approving
 * verifies the teacher; either way the backend tells them. The note stays
 * with admins.
 */
export async function POST(request: NextRequest, { params }: DecisionRouteContext) {
  const parsed = decisionBodySchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Choose approve or reject, with a note of up to 1000 characters." },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    )
  }

  const { decision, note } = parsed.data

  return forwardIdentityCheckAction(request, (await params).id, {
    action: "decision",
    body: { decision, ...(note ? { note } : {}) },
    fallbackMessage: "Unable to save the identity check decision.",
  })
}
