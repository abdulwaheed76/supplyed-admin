import { routeRequest } from "@/lib/api/route-request"
import {
  submissionResponseSchema,
  type SubmissionStatus,
  type WaitingListSubmission,
} from "@/lib/waiting-list/schema"

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus
): Promise<WaitingListSubmission> {
  return routeRequest(
    `/api/contact/founding-interest/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: { status },
      schema: submissionResponseSchema,
      fallbackMessage: "Unable to update the submission status.",
    }
  )
}
