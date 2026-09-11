"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { reviewDocument } from "@/lib/api/document-api"

/**
 * Every mutation for the documents module. The request lives in
 * `lib/api/document-api`; this only wires it to React Query.
 *
 * A review is submitted from a dialog on the queue, so there is nowhere to
 * navigate afterwards — `refresh()` re-renders the server tree with the new
 * status. The dialog closes itself through the per-call `onSuccess`.
 */
export function useReviewDocument() {
  const router = useRouter()

  return useMutation({
    mutationFn: reviewDocument,
    onSuccess: () => {
      router.refresh()
    },
  })
}
