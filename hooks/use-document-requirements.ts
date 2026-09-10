"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import {
  createDocumentRequirement,
  deleteDocumentRequirement,
  updateDocumentRequirement,
} from "@/lib/api/document-requirement-api"

/**
 * Every mutation for the document requirements module. All three edit a list
 * that is server-rendered on the document type's edit page, so `refresh()` is
 * the invalidation.
 */
export function useCreateDocumentRequirement() {
  const router = useRouter()

  return useMutation({
    mutationFn: createDocumentRequirement,
    onSuccess: () => {
      router.refresh()
    },
  })
}

export function useUpdateDocumentRequirement() {
  const router = useRouter()

  return useMutation({
    mutationFn: updateDocumentRequirement,
    onSuccess: () => {
      router.refresh()
    },
  })
}

export function useDeleteDocumentRequirement() {
  const router = useRouter()

  return useMutation({
    mutationFn: deleteDocumentRequirement,
    onSuccess: () => {
      router.refresh()
    },
  })
}
