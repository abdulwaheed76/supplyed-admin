"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RefreshWaitingListButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCwIcon aria-hidden="true" className={isPending ? "animate-spin" : undefined} />
      {isPending ? "Refreshing..." : label}
    </Button>
  )
}
