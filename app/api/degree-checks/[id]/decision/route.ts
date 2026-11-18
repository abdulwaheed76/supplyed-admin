import type { NextRequest } from "next/server"
import { z } from "zod"

import { degreeErrorResponse, forwardDegreeCheckAction } from "@/lib/degree-checks/forward-degree-check-action"
import { degreeCheckDecisionSchema } from "@/lib/degree-checks/schema"

type DecisionRouteContext = {
  params: Promise<{ id: string }>
}

const decisionBodySchema = z.object({
  decision: degreeCheckDecisionSchema,
  note: z.string().trim().max(1000).optional(),
})

/** Forwards to `POST /degree-checks/admin/:id/decision`: whether schools see the verified degree. */
export async function POST(request: NextRequest, { params }: DecisionRouteContext) {
  const parsed = decisionBodySchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return degreeErrorResponse("Choose approve or reject, with a note of up to 1000 characters.", 400)
  }

  const { decision, note } = parsed.data

  return forwardDegreeCheckAction(request, (await params).id, {
    action: "decision",
    body: { decision, ...(note ? { note } : {}) },
    fallbackMessage: "Unable to save the degree check decision.",
  })
}
