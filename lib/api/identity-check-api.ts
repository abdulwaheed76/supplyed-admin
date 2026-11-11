import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import {
  identityCheckSchema,
  type IdentityCheck,
  type IdentityCheckDecision,
} from "@/lib/identity-checks/schema"

const identityCheckResponseSchema = z.object({ check: identityCheckSchema })

function checkPath(id: string, action: string) {
  return `/api/identity-checks/${encodeURIComponent(id.slice(0, 128))}/${action}`
}

export async function reissueIdentityCheck(id: string): Promise<IdentityCheck> {
  const result = await routeRequest(checkPath(id, "reissue"), {
    schema: identityCheckResponseSchema,
    fallbackMessage: "Unable to send a new identity check link.",
  })

  return result.check
}

export async function decideIdentityCheck({
  id,
  decision,
  note,
}: {
  id: string
  decision: IdentityCheckDecision
  note?: string
}): Promise<IdentityCheck> {
  const result = await routeRequest(checkPath(id, "decision"), {
    body: { decision, ...(note?.trim() ? { note: note.trim() } : {}) },
    schema: identityCheckResponseSchema,
    fallbackMessage: "Unable to save the identity check decision.",
  })

  return result.check
}

export async function retryIdentityCheckRetrieval(id: string): Promise<IdentityCheck> {
  const result = await routeRequest(checkPath(id, "retry-retrieval"), {
    schema: identityCheckResponseSchema,
    fallbackMessage: "Unable to retry fetching the TrustID results.",
  })

  return result.check
}
