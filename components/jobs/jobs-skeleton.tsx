import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function JobsListSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-44" />
        </CardHeader>
        <CardContent className="space-y-5">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex items-center gap-5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export function JobDetailsSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <Skeleton className="h-7 w-28" />
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-7 w-full max-w-xl" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
