import { z } from "zod"

import { routeRequest } from "@/lib/api/route-request"
import { degreeCheckSchema, type DegreeCheck, type DegreeCheckDecision } from "@/lib/degree-checks/schema"

const degreeCheckResponseSchema = z.object({ check: degreeCheckSchema })

function checkPath(id: string, action: string) {
  return `/api/degree-checks/${encodeURIComponent(id.slice(0, 128))}/${action}`
}

export async function decideDegreeCheck({
  id,
  decision,
  note,
}: {
  id: string
  decision: DegreeCheckDecision
  note?: string
}): Promise<DegreeCheck> {
  const result = await routeRequest(checkPath(id, "decision"), {
    body: { decision, ...(note?.trim() ? { note: note.trim() } : {}) },
    schema: degreeCheckResponseSchema,
    fallbackMessage: "Unable to save the degree check decision.",
  })

  return result.check
}

export async function cancelDegreeCheck({ id, note }: { id: string; note?: string }): Promise<DegreeCheck> {
  const result = await routeRequest(checkPath(id, "cancel"), {
    body: note?.trim() ? { note: note.trim() } : {},
    schema: degreeCheckResponseSchema,
    fallbackMessage: "Unable to cancel the degree check.",
  })

  return result.check
}
