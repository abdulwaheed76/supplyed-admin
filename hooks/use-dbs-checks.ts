"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { decideDbsCheck, previewDbsCheck, sendDbsCheck } from "@/lib/api/dbs-check-api"

/** Builds the application without sending it, so the admin sees what uCheck would get. */
export function usePreviewDbsCheck() {
  return useMutation({ mutationFn: previewDbsCheck })
}

/** Refreshing shows the DBS check in place of the send button. */
export function useSendDbsCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: sendDbsCheck,
    onSuccess: () => {
      router.refresh()
    },
  })
}

export function useDecideDbsCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: decideDbsCheck,
    onSuccess: () => {
      router.refresh()
    },
  })
}
