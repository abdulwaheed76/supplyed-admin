import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function WaitingListLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6" aria-busy="true" aria-label="Loading waiting list">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      <Card><CardContent><Skeleton className="h-16 w-full" /></CardContent></Card>
      <Card>
        <CardHeader className="border-b"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-64" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    </div>
  )
}
