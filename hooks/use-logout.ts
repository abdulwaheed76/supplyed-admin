"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { logoutAction } from "@/app/actions/auth"

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      queryClient.clear()
      router.replace("/login")
      router.refresh()
    },
  })
}
