import type { NextRequest } from "next/server"
import { z } from "zod"

import { degreeErrorResponse, forwardDegreeCheckAction } from "@/lib/degree-checks/forward-degree-check-action"

type CancelRouteContext = {
  params: Promise<{ id: string }>
}

const cancelBodySchema = z.object({
  note: z.string().trim().max(1000).optional(),
})

/** Forwards to `POST /degree-checks/admin/:id/cancel`, for a check Hedd never confirmed. The note is shown to the teacher. */
export async function POST(request: NextRequest, { params }: CancelRouteContext) {
  const parsed = cancelBodySchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return degreeErrorResponse("The note can be up to 1000 characters.", 400)
  }

  const { note } = parsed.data

  return forwardDegreeCheckAction(request, (await params).id, {
    action: "cancel",
    body: note ? { note } : {},
    fallbackMessage: "Unable to cancel the degree check.",
  })
}
