import { RefreshInvoicesButton } from "@/components/invoices/refresh-invoices-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function InvoiceLoadError({ status, message }: { status: number; message: string }) {
  return (
    <Card role="alert">
      <CardHeader>
        <CardTitle>{status === 403 ? "Access denied" : status === 404 ? "Payments unavailable" : status === 401 ? "Session expired" : "Unable to load payments"}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      {status !== 401 && status !== 403 && status !== 404 ? <CardContent><RefreshInvoicesButton /></CardContent> : null}
    </Card>
  )
}

export function InvoiceInterpretationNote() {
  return <p className="text-xs leading-relaxed text-muted-foreground">Invoice paid means the invoice is marked paid, not that the instructor&apos;s bank received a payout. Recorded refunds can include pending requests. This history does not include every payment attempt or bank settlement.</p>
}

export function InvoicesSkeleton() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6" aria-label="Loading invoices" role="status">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-full max-w-lg" />
      <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-28 rounded-xl" />)}</div>
      <Card><CardContent className="space-y-5">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-20 w-full" />)}</CardContent></Card>
      <span className="sr-only">Loading invoices...</span>
    </div>
  )
}
