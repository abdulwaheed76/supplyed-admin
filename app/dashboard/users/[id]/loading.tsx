import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function UserDetailsLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
        <Skeleton className="h-7 w-28" />
        <Card>
          <CardContent className="flex items-center gap-4">
            <Skeleton className="size-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-full max-w-56" />
              <Skeleton className="h-4 w-full max-w-72" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-80" />
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="border-b">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full max-w-64" />
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  )
}
