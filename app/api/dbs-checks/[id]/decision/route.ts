import type { NextRequest } from "next/server"
import { z } from "zod"

import { dbsErrorResponse, forwardDbsCheckRequest } from "@/lib/dbs-checks/forward-dbs-check-request"
import { dbsCheckDecisionSchema, dbsCheckResponseSchema } from "@/lib/dbs-checks/schema"

type DecisionRouteContext = {
  params: Promise<{ id: string }>
}

const decisionBodySchema = z.object({
  decision: dbsCheckDecisionSchema,
  note: z.string().trim().max(1000).optional(),
})

/** Forwards to `POST /dbs-checks/admin/:id/decision`, which sets whether the teacher's DBS counts as verified. */
export async function POST(request: NextRequest, { params }: DecisionRouteContext) {
  const parsed = decisionBodySchema.safeParse(await request.json().catch(() => null))
  const id = (await params).id.trim().slice(0, 128)

  if (!parsed.success || !id) {
    return dbsErrorResponse("Choose approve or reject, with a note of up to 1000 characters.", 400)
  }

  const { decision, note } = parsed.data

  return forwardDbsCheckRequest(request, {
    path: `dbs-checks/admin/${encodeURIComponent(id)}/decision`,
    body: { decision, ...(note ? { note } : {}) },
    schema: dbsCheckResponseSchema,
    key: "dbsCheck",
    fallbackMessage: "Unable to save the DBS decision.",
  })
}
