"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { cancelDegreeCheck, decideDegreeCheck } from "@/lib/api/degree-check-api"

/** Refreshing shows the decision in place of the approve and reject buttons. */
export function useDecideDegreeCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: decideDegreeCheck,
    onSuccess: () => {
      router.refresh()
    },
  })
}

/** Refreshing shows the check as cancelled, so the teacher can start a new one. */
export function useCancelDegreeCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: cancelDegreeCheck,
    onSuccess: () => {
      router.refresh()
    },
  })
}
