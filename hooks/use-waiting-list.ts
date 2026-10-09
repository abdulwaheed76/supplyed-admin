"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { updateSubmissionStatus } from "@/lib/api/waiting-list-api"
import type { SubmissionStatus } from "@/lib/waiting-list/schema"

export function useUpdateSubmissionStatus() {
  const router = useRouter()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SubmissionStatus }) =>
      updateSubmissionStatus(id, status),
    onSuccess: () => {
      router.refresh()
    },
  })
}
