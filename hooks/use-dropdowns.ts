"use client"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { saveDropdown } from "@/lib/api/dropdown-api"
export function useDropdowns() {
  const router = useRouter()
  return useMutation({ mutationFn: saveDropdown, retry: false, onSuccess: () => router.refresh() })
}
