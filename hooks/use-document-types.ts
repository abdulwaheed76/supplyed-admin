"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import {
  createDocumentType,
  deleteDocumentType,
  updateDocumentType,
} from "@/lib/api/document-type-api"

/**
 * Every mutation for the document types module. The requests and their
 * validation live in `lib/api/document-type-api`; these hooks only wire them to
 * React Query and handle what happens afterwards.
 *
 * Reads come from Server Components, so `router.refresh()` is the invalidation.
 * Once a list read moves into a query, invalidate its key here too.
 *
 * Mutations are configured with `retry: 0` in `QueryProvider`, so a rejected
 * validation is not retried.
 */
export function useCreateDocumentType() {
  const router = useRouter()

  return useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => {
      router.push("/dashboard/document-types")
      router.refresh()
    },
  })
}

export function useUpdateDocumentType() {
  const router = useRouter()

  return useMutation({
    mutationFn: updateDocumentType,
    onSuccess: () => {
      router.push("/dashboard/document-types")
      router.refresh()
    },
  })
}

/**
 * Deletion happens from the list, so there is nowhere to navigate afterwards —
 * `refresh()` alone re-renders the table without the deleted row.
 */
export function useDeleteDocumentType() {
  const router = useRouter()

  return useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: () => {
      router.refresh()
    },
  })
}
