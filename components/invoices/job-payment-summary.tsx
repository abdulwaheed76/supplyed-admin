import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatInvoiceAmount } from "@/lib/invoices/presentation"
import type { JobPayments } from "@/lib/invoices/schema"

export function JobPaymentSummary({ payments }: { payments: JobPayments }) {
  const counts = [
    ["Bookings", payments.bookingCount, "Includes all booking statuses"],
    ["Invoices", payments.totalsByStatus.reduce((count, group) => count + group.invoiceCount, 0), "Includes voided and pending invoices"],
    ["Completed bookings awaiting invoice", payments.completedBookingsWithoutInvoice, "Completed bookings with no current invoice"],
  ] as const

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {counts.map(([label, count, description]) => (
          <Card key={label}>
            <CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-semibold tabular-nums">{count}</p><p className="mt-1 text-xs text-muted-foreground">{description}</p></CardContent>
          </Card>
        ))}
      </div>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Whole-job payment summary</CardTitle>
          <CardDescription>All invoices for this job, grouped by currency and status. These totals do not change when you filter or change pages.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.totalsByStatus.length ? (
            <Table>
              <TableHeader><TableRow><TableHead>Currency / status</TableHead><TableHead>Invoices</TableHead><TableHead>Teaching amount</TableHead><TableHead>SupplyEd fee</TableHead><TableHead>Invoice face value</TableHead><TableHead>Recorded refunds</TableHead></TableRow></TableHeader>
              <TableBody>
                {payments.totalsByStatus.map((group) => (
                  <TableRow key={`${group.currency}:${group.status}`}>
                    <TableCell><span className="mr-2 text-xs font-medium">{group.currency.toUpperCase()}</span><InvoiceStatusBadge status={group.status} /></TableCell>
                    <TableCell>{group.invoiceCount}</TableCell>
                    <TableCell>{formatInvoiceAmount(group.teacherAmountPence, group.currency)}</TableCell>
                    <TableCell>{formatInvoiceAmount(group.feeAmountPence, group.currency)}</TableCell>
                    <TableCell className="font-semibold">{formatInvoiceAmount(group.totalAmountPence, group.currency)}</TableCell>
                    <TableCell>{formatInvoiceAmount(group.amountRefundedPence, group.currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-sm text-muted-foreground">No invoice totals yet.</p>}
          <p className="text-xs leading-relaxed text-muted-foreground">Face values show the original invoice amounts, not the remaining balance or net earnings. Voided and pending invoices are separate from paid invoices.</p>
        </CardContent>
      </Card>
    </>
  )
}
