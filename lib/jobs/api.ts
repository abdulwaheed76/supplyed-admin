import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"

type JobsApiResult =
  | { ok: true; body: unknown }
  | { ok: false; message: string; status: number }

export async function fetchJobsApi(
  path: string,
  searchParams?: Record<string, string>
): Promise<JobsApiResult> {
  const result = await adminApiRequest({
    path,
    searchParams,
    schema: z.unknown(),
    serviceName: "jobs",
    fallbackMessage: "Unable to load jobs.",
    debugLabel: "jobs-api",
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, body: result.data }
}
