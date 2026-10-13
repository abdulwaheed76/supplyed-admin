import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon, ReceiptTextIcon } from "lucide-react"

import { InvoiceDetailsDialog, InvoiceLinks, InvoiceParty } from "@/components/invoices/invoice-details-dialog"
import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatInvoiceAmount, formatInvoiceDate, getInvoicesHref } from "@/lib/invoices/presentation"
import type { Invoice, InvoicePagination, InvoiceStatus } from "@/lib/invoices/schema"

export function InvoicesTable({
  invoices,
  pagination,
  basePath,
  status,
  jobId,
  audit = false,
}: {
  invoices: Invoice[]
  pagination: InvoicePagination
  basePath: string
  status?: InvoiceStatus
  jobId?: string
  audit?: boolean
}) {
  const href = (page: number) => getInvoicesHref(basePath, page, status, jobId)
  const first = (pagination.page - 1) * pagination.limit + 1
  const last = Math.min(first + invoices.length - 1, pagination.total)

  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <CardTitle>Invoices</CardTitle>
        <CardDescription>{pagination.total.toLocaleString("en-GB")} invoice{pagination.total === 1 ? "" : "s"}{status || jobId ? " matching your filters" : " in billing history"}.</CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4">
        {invoices.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice / job</TableHead>
                <TableHead>Payer / recipient</TableHead>
                <TableHead>Amounts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="min-w-52 max-w-72 align-top whitespace-normal">
                    <p className="break-all font-semibold">{invoice.invoiceNumber || "Awaiting invoice number"}</p>
                    <Link href={`/dashboard/jobs/${encodeURIComponent(invoice.booking.jobId)}`} className="mt-1 block break-words text-sm underline-offset-4 hover:underline">{invoice.booking.jobTitle}</Link>
                    <p className="mt-2 text-xs text-muted-foreground">{formatInvoiceDate(invoice.createdAt)}</p>
                    {!audit ? <Link className="mt-2 inline-block text-xs font-medium underline underline-offset-4" href={`/dashboard/jobs/${encodeURIComponent(invoice.booking.jobId)}/payments`}>View job payments</Link> : null}
                  </TableCell>
                  <TableCell className="min-w-48 max-w-64 space-y-3 align-top whitespace-normal">
                    <div><p className="mb-0.5 text-xs text-muted-foreground">Payer / billed school</p><InvoiceParty party={invoice.booking.institution} /></div>
                    <div><p className="mb-0.5 text-xs text-muted-foreground">Recipient / instructor</p><InvoiceParty party={invoice.booking.instructor} /></div>
                  </TableCell>
                  <TableCell className="min-w-44 align-top">
                    <p className="font-semibold">{formatInvoiceAmount(invoice.totalAmountPence, invoice.currency)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Teaching: {formatInvoiceAmount(invoice.teacherAmountPence, invoice.currency)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">SupplyEd fee: {formatInvoiceAmount(invoice.feeAmountPence, invoice.currency)}</p>
                    {invoice.dueAt ? <p className="mt-2 text-xs text-muted-foreground">Due: {formatInvoiceDate(invoice.dueAt)}</p> : null}
                  </TableCell>
                  <TableCell className="min-w-44 max-w-64 space-y-2 align-top whitespace-normal">
                    <InvoiceStatusBadge status={invoice.status} />
                    {invoice.amountRefundedPence > 0 ? <p className="text-xs">Recorded refund: {formatInvoiceAmount(invoice.amountRefundedPence, invoice.currency)}</p> : null}
                    {invoice.disputeStatus ? <p className="break-words text-xs text-destructive">Dispute: {invoice.disputeStatus}</p> : null}
                  </TableCell>
                  <TableCell className="min-w-44 space-y-3 align-top whitespace-normal">
                    <InvoiceLinks invoice={invoice} />
                    <InvoiceDetailsDialog invoice={invoice} audit={audit} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <ReceiptTextIcon className="size-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-semibold">{pagination.page > 1 ? "No invoices on this page" : status || jobId ? "No matching invoices" : "No invoices yet"}</h2>
            <p className="max-w-md text-sm text-muted-foreground">{pagination.page > 1 ? "Return to the first page to see the available records." : status || jobId ? "Try another status or clear the filters." : "Invoices appear here when completed bookings are invoiced."}</p>
            {pagination.page > 1 ? <Button asChild variant="outline"><Link href={href(1)}>Go to first page</Link></Button> : null}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">{invoices.length ? `${first}–${last} of ${pagination.total}` : `${pagination.total} total`} · Page {pagination.page} of {Math.max(1, pagination.totalPages)}</p>
          <div className="flex gap-2">
            {pagination.page > 1 ? <Button asChild variant="outline" size="sm"><Link href={href(pagination.page - 1)}><ChevronLeftIcon aria-hidden="true" />Previous</Link></Button> : <Button variant="outline" size="sm" disabled><ChevronLeftIcon aria-hidden="true" />Previous</Button>}
            {pagination.hasNextPage ? <Button asChild variant="outline" size="sm"><Link href={href(pagination.page + 1)}>Next<ChevronRightIcon aria-hidden="true" /></Link></Button> : <Button variant="outline" size="sm" disabled>Next<ChevronRightIcon aria-hidden="true" /></Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
