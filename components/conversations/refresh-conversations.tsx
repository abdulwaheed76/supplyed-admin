"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function RefreshConversations() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button variant="outline" onClick={() => startTransition(() => router.refresh())} disabled={pending}>
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} />
      {pending ? "Refreshing..." : "Refresh latest"}
    </Button>
  )
}
