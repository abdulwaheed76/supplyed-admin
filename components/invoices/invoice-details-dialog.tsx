"use client"

import Link from "next/link"
import { ExternalLinkIcon } from "lucide-react"

import { InvoiceStatusBadge } from "@/components/invoices/invoice-status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatInvoiceAmount, formatInvoiceDate, getInvoiceExternalUrl } from "@/lib/invoices/presentation"
import type { Invoice } from "@/lib/invoices/schema"

export function InvoiceParty({ party }: { party: Invoice["booking"]["institution"] }) {
  const name = party.name || (party.userId ? "View user" : "Deleted user")
  return party.userId ? (
    <Link className="font-medium underline-offset-4 hover:underline" href={`/dashboard/users/${encodeURIComponent(party.userId)}`}>{name}</Link>
  ) : <span>{name}</span>
}

export function InvoiceLinks({ invoice }: { invoice: Invoice }) {
  const hosted = getInvoiceExternalUrl(invoice.hostedInvoiceUrl)
  const pdf = getInvoiceExternalUrl(invoice.invoicePdfUrl)
  return (
    <div className="flex flex-wrap gap-2">
      {hosted ? <Button asChild size="sm" variant="outline"><a href={hosted} target="_blank" rel="noopener noreferrer">View invoice<ExternalLinkIcon aria-hidden="true" /></a></Button> : null}
      {pdf ? <Button asChild size="sm" variant="outline"><a href={pdf} target="_blank" rel="noopener noreferrer">Invoice PDF<ExternalLinkIcon aria-hidden="true" /></a></Button> : null}
      {!hosted && !pdf ? <span className="text-xs text-muted-foreground">Invoice links not available yet.</span> : null}
    </div>
  )
}

export function InvoiceDetailsDialog({ invoice, audit = false }: { invoice: Invoice; audit?: boolean }) {
  const money = (amount: number) => formatInvoiceAmount(amount, invoice.currency)
  const items: [string, string | number][] = [
    ["Invoice ID", invoice.id],
    ["Booking ID", invoice.booking.id],
    ["Payer user ID", invoice.booking.institution.userId || "Deleted or unavailable user"],
    ["Payer profile ID", invoice.booking.institution.id],
    ["Recipient user ID", invoice.booking.instructor.userId || "Deleted or unavailable user"],
    ["Recipient profile ID", invoice.booking.instructor.id],
    ["Purchase order", invoice.poNumber || "Not provided"],
    ["Agreed rate", `${money(invoice.rateAmount * 100)} / ${invoice.payType}`],
    ["Units worked", invoice.unitsWorked ?? "Fixed price"],
    ["Teaching amount", money(invoice.teacherAmountPence)],
    ["SupplyEd fee", money(invoice.feeAmountPence)],
    ["Invoice total", money(invoice.totalAmountPence)],
    ["Recorded refunds", money(invoice.amountRefundedPence)],
    ["Dispute status", invoice.disputeStatus || "None recorded"],
    ["Booking starts", formatInvoiceDate(invoice.booking.startDate)],
    ["Booking ends", formatInvoiceDate(invoice.booking.endDate)],
    ["Created", formatInvoiceDate(invoice.createdAt)],
    ["Updated", formatInvoiceDate(invoice.updatedAt)],
    ["Due", formatInvoiceDate(invoice.dueAt)],
    ["Paid", formatInvoiceDate(invoice.paidAt)],
    ["Voided", formatInvoiceDate(invoice.voidedAt)],
    ...(audit ? [
      ["Stripe invoice", invoice.stripeInvoiceId || "Not recorded"],
      ["Stripe payment intent", invoice.stripePaymentIntentId || "Not recorded"],
      ["Recipient Stripe account", invoice.destinationAccountId || "Not recorded"],
    ] satisfies [string, string][] : []),
  ]

  return (
    <Dialog>
      <DialogTrigger asChild><Button variant="outline" size="sm">Details</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="break-all">{invoice.invoiceNumber || "Invoice details"}</DialogTitle>
          <DialogDescription>{invoice.booking.jobTitle}</DialogDescription>
        </DialogHeader>
        <InvoiceStatusBadge status={invoice.status} />
        <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div><dt className="text-xs text-muted-foreground">Payer / billed school</dt><dd className="mt-1 break-words"><InvoiceParty party={invoice.booking.institution} /></dd></div>
          <div><dt className="text-xs text-muted-foreground">Recipient / instructor</dt><dd className="mt-1 break-words"><InvoiceParty party={invoice.booking.instructor} /></dd></div>
          <div>
            <dt className="text-xs text-muted-foreground">Issued by</dt>
            <dd className="mt-1 break-all text-sm">{invoice.createdById ? <Link className="underline underline-offset-4" href={`/dashboard/users/${encodeURIComponent(invoice.createdById)}`}>{invoice.createdById}</Link> : "Deleted or unavailable user"}</dd>
          </div>
          <div><dt className="text-xs text-muted-foreground">Job</dt><dd className="mt-1 break-words"><Link className="text-sm underline underline-offset-4" href={`/dashboard/jobs/${encodeURIComponent(invoice.booking.jobId)}`}>{invoice.booking.jobTitle}</Link></dd></div>
          {items.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-all text-sm">{value}</dd></div>)}
        </dl>
        <InvoiceLinks invoice={invoice} />
        <p className="text-xs text-muted-foreground">The school is the billed party. The issuer may be an admin and is not necessarily the person who paid.</p>
      </DialogContent>
    </Dialog>
  )
}
