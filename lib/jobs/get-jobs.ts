import "server-only"

import { z } from "zod"

import { fetchJobsApi } from "@/lib/jobs/api"
import { jobSchema, type Job } from "@/lib/jobs/schema"

const jobsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    jobs: z.array(jobSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
      hasNextPage: z.boolean(),
    }),
  }),
})

type GetJobsOptions = {
  page: number
  limit: number
}

export type GetJobsResult =
  | {
      ok: true
      jobs: Job[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNextPage: boolean
      }
    }
  | { ok: false; message: string; status: number }

export async function getJobs({
  page,
  limit,
}: GetJobsOptions): Promise<GetJobsResult> {
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return { ok: false, message: "The jobs page is invalid.", status: 400 }
  }

  const response = await fetchJobsApi("jobs/admin/all", {
    page: String(page),
    limit: String(limit),
  })

  if (!response.ok) {
    return response
  }

  const parsed = jobsResponseSchema.safeParse(response.body)

  if (!parsed.success) {
    return {
      ok: false,
      message: "The jobs service returned an invalid response.",
      status: 502,
    }
  }

  return {
    ok: true,
    jobs: parsed.data.data.jobs,
    pagination: parsed.data.data.pagination,
  }
}
