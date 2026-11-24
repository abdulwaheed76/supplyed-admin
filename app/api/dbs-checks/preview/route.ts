import type { NextRequest } from "next/server"

import { dbsErrorResponse, forwardDbsCheckRequest } from "@/lib/dbs-checks/forward-dbs-check-request"
import { dbsCheckPreviewResponseSchema, sendDbsCheckBodySchema } from "@/lib/dbs-checks/schema"

/** Forwards to `POST /dbs-checks/admin/preview`: what would be sent to uCheck, or why it can't be. Sends nothing. */
export async function POST(request: NextRequest) {
  const parsed = sendDbsCheckBodySchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return dbsErrorResponse("Say who checked the identity evidence (up to 60 characters).", 400)
  }

  return forwardDbsCheckRequest(request, {
    path: "dbs-checks/admin/preview",
    body: parsed.data,
    schema: dbsCheckPreviewResponseSchema,
    key: "preview",
    fallbackMessage: "Unable to check the DBS application.",
  })
}
