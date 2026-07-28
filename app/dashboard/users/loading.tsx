import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UsersLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        <Card>
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full max-w-48" />
                  <Skeleton className="h-3 w-full max-w-64" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
    </div>
  )
}
