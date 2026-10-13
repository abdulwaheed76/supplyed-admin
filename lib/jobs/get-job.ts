import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { jobSchema, type Job } from "@/lib/jobs/schema"

export type GetJobResult =
  | { ok: true; job: Job }
  | { ok: false; message: string; status: number }

export async function getJob(jobId: string): Promise<GetJobResult> {
  const id = jobId.trim()
  if (!id || id.length > 128) {
    return { ok: false, message: "The job ID is invalid.", status: 400 }
  }

  // Despite its name, this endpoint lets admins read jobs in every status.
  const result = await adminApiRequest({
    path: `jobs/mine/${encodeURIComponent(id)}`,
    schema: z.object({ success: z.literal(true), data: jobSchema }),
    serviceName: "jobs",
    fallbackMessage: "Unable to load this job.",
    debugLabel: "job-api",
  })

  return result.ok ? { ok: true, job: result.data.data } : result
}
