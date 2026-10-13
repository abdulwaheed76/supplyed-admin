"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RefreshInvoicesButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button variant="outline" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      <RefreshCwIcon aria-hidden="true" className={pending ? "animate-spin" : undefined} />
      {pending ? "Refreshing..." : "Refresh"}
    </Button>
  )
}
