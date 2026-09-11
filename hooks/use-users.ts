"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { deleteUser } from "@/lib/api/user-api"

/**
 * Every mutation for the users module. The request lives in
 * `lib/api/user-api`; this only wires it to React Query.
 *
 * Deletion can start from the list or from the deleted user's own page. The
 * hook only refreshes — reads are server-rendered — and the button decides
 * whether it also has to leave the page it is on.
 */
export function useDeleteUser() {
  const router = useRouter()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      router.refresh()
    },
  })
}
