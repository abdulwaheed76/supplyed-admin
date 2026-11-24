import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import {
  dbsCheckPreviewSchema,
  dbsCheckSchema,
  type DbsCheck,
  type DbsCheckDecision,
  type DbsCheckPreview,
} from "@/lib/dbs-checks/schema"

type SendInput = { identityVerificationId: string; evidenceCheckedBy: string }

export async function previewDbsCheck(input: SendInput): Promise<DbsCheckPreview> {
  const result = await routeRequest("/api/dbs-checks/preview", {
    body: input,
    schema: z.object({ preview: dbsCheckPreviewSchema }),
    fallbackMessage: "Unable to check the DBS application.",
  })

  return result.preview
}

export async function sendDbsCheck(input: SendInput): Promise<DbsCheck> {
  const result = await routeRequest("/api/dbs-checks", {
    body: input,
    schema: z.object({ dbsCheck: dbsCheckSchema }),
    fallbackMessage: "Unable to send the DBS application to uCheck.",
  })

  return result.dbsCheck
}

export async function decideDbsCheck({
  id,
  decision,
  note,
}: {
  id: string
  decision: DbsCheckDecision
  note?: string
}): Promise<DbsCheck> {
  const result = await routeRequest(`/api/dbs-checks/${encodeURIComponent(id.slice(0, 128))}/decision`, {
    body: { decision, ...(note?.trim() ? { note: note.trim() } : {}) },
    schema: z.object({ dbsCheck: dbsCheckSchema }),
    fallbackMessage: "Unable to save the DBS decision.",
  })

  return result.dbsCheck
}
