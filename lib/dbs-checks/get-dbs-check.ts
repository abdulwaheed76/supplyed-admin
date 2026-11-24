import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { dbsChecksResponseSchema, type DbsCheck } from "@/lib/dbs-checks/schema"

export type GetDbsCheckResult =
  | { ok: true; dbsCheck: DbsCheck | null }
  | { ok: false; message: string; status: number }

/** The DBS check sent to uCheck for an identity check, or null if none has been. */
export async function getDbsCheckForIdentityCheck(identityCheckId: string): Promise<GetDbsCheckResult> {
  const result = await adminApiRequest({
    path: "dbs-checks/admin",
    searchParams: { identityVerificationId: identityCheckId, limit: 1 },
    schema: dbsChecksResponseSchema,
    serviceName: "DBS checks",
    fallbackMessage: "Unable to load the DBS check.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, dbsCheck: result.data.data.dbsChecks[0] ?? null }
}
