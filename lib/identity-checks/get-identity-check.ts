import "server-only"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import {
  identityCheckResponseSchema,
  type IdentityCheck,
} from "@/lib/identity-checks/schema"

export type GetIdentityCheckResult =
  | { ok: true; check: IdentityCheck }
  | { ok: false; message: string; status: number }

export async function getIdentityCheck(id: string): Promise<GetIdentityCheckResult> {
  const normalizedId = id.trim()

  if (!normalizedId || normalizedId.length > 128) {
    return { ok: false, message: "The identity check ID is invalid.", status: 400 }
  }

  const result = await adminApiRequest({
    path: `identity-verification/admin/${encodeURIComponent(normalizedId)}`,
    schema: identityCheckResponseSchema,
    serviceName: "identity verification",
    fallbackMessage: "Unable to load this identity check.",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, check: result.data.data }
}
