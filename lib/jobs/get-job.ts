import "server-only"

import { getJobs } from "@/lib/jobs/get-jobs"
import type { Job } from "@/lib/jobs/schema"

export type GetJobResult =
  | { ok: true; job: Job }
  | { ok: false; message: string; status: number }

export async function getJob(jobId: string, fromPage = 1): Promise<GetJobResult> {
  const id = jobId.trim()
  if (!id || id.length > 128) {
    return { ok: false, message: "The job ID is invalid.", status: 400 }
  }

  // The public detail API hides drafts and expired jobs. The admin list includes them.
  const firstPage = Math.ceil(fromPage / 5)
  const first = await getJobs({ page: firstPage, limit: 100 })
  if (!first.ok) return first
  const selected = first.jobs.find((job) => job.id === id)
  if (selected) return { ok: true, job: selected }

  for (let page = 1; page <= first.pagination.totalPages; page += 1) {
    if (page === firstPage) continue
    const result = await getJobs({ page, limit: 100 })
    if (!result.ok) return result
    const job = result.jobs.find((item) => item.id === id)
    if (job) return { ok: true, job }
  }

  return { ok: false, message: "Job not found", status: 404 }
}
