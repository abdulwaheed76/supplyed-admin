import type { NextRequest } from "next/server"

import { dbsErrorResponse, forwardDbsCheckRequest } from "@/lib/dbs-checks/forward-dbs-check-request"
import { dbsCheckResponseSchema, sendDbsCheckBodySchema } from "@/lib/dbs-checks/schema"

/**
 * Forwards to `POST /dbs-checks/admin`: sends the teacher's Enhanced DBS
 * application to uCheck. On uCheck's live system this costs money, so the
 * button that calls it previews the application first.
 */
export async function POST(request: NextRequest) {
  const parsed = sendDbsCheckBodySchema.safeParse(await request.json().catch(() => null))

  if (!parsed.success) {
    return dbsErrorResponse("Say who checked the identity evidence (up to 60 characters).", 400)
  }

  return forwardDbsCheckRequest(request, {
    path: "dbs-checks/admin",
    body: parsed.data,
    schema: dbsCheckResponseSchema,
    key: "dbsCheck",
    identityCheckId: parsed.data.identityVerificationId,
    fallbackMessage: "Unable to send the DBS application to uCheck.",
  })
}
