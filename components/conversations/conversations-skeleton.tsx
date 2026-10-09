import { Skeleton } from "@/components/ui/skeleton"

export function ConversationsSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6" role="status" aria-label="Loading conversations">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-6">
        <Skeleton className="h-[32rem] rounded-xl" />
        <Skeleton className="h-[28rem] rounded-xl" />
      </div>
    </div>
  )
}
