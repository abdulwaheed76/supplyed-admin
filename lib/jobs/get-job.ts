import "server-only"

import { z } from "zod"

import { fetchJobsApi } from "@/lib/jobs/api"
import { jobSchema, type Job } from "@/lib/jobs/schema"

const jobResponseSchema = z.object({
  success: z.literal(true),
  data: jobSchema,
})

export type GetJobResult =
  | { ok: true; job: Job }
  | { ok: false; message: string; status: number }

export async function getJob(jobId: string): Promise<GetJobResult> {
  const normalizedJobId = jobId.trim()

  if (!normalizedJobId || normalizedJobId.length > 128) {
    return { ok: false, message: "The job ID is invalid.", status: 400 }
  }

  const response = await fetchJobsApi(
    `jobs/${encodeURIComponent(normalizedJobId)}`
  )

  if (!response.ok) {
    return response
  }

  const parsed = jobResponseSchema.safeParse(response.body)

  if (!parsed.success) {
    return {
      ok: false,
      message: "The jobs service returned an invalid response.",
      status: 502,
    }
  }

  return { ok: true, job: parsed.data.data }
}
