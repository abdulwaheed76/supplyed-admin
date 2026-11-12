"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import {
  decideIdentityCheck,
  reissueIdentityCheck,
  retryIdentityCheckRetrieval,
} from "@/lib/api/identity-check-api"

/**
 * A reissue creates a new check, so the admin is taken to it: the old page
 * would only show the cancelled link.
 */
export function useReissueIdentityCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: reissueIdentityCheck,
    onSuccess: (check) => {
      router.push(`/dashboard/identity-checks/${encodeURIComponent(check.id)}`)
      router.refresh()
    },
  })
}

/** Refreshing shows the decision in place of the approve and reject buttons. */
export function useDecideIdentityCheck() {
  const router = useRouter()

  return useMutation({
    mutationFn: decideIdentityCheck,
    onSuccess: () => {
      router.refresh()
    },
  })
}

/** The worker picks the check up within seconds; refreshing shows the cleared error. */
export function useRetryIdentityCheckRetrieval() {
  const router = useRouter()

  return useMutation({
    mutationFn: retryIdentityCheckRetrieval,
    onSuccess: () => {
      router.refresh()
    },
  })
}
