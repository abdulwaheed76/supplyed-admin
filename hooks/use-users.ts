"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { createUser, deleteUser, updateUser } from "@/lib/api/user-api"

export function useCreateUser() {
  const router = useRouter()
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => router.refresh(),
  })
}

/**
 * Every mutation for the users module. The request lives in
 * `lib/api/user-api`; this only wires it to React Query.
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

export function useUpdateUser() {
  const router = useRouter()

  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      router.refresh()
    },
  })
}