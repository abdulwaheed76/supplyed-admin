import "server-only"

import { z } from "zod"

import { adminApiRequest, type AdminApiResult } from "@/lib/api/admin-api-client"
import {
  invoiceQuerySchema,
  invoicesResponseSchema,
  jobPaymentsResponseSchema,
  type InvoiceQuery,
  type InvoicesPage,
  type BillingSummary,
  type JobPayments,
} from "@/lib/invoices/schema"

export async function getInvoices(query: InvoiceQuery): Promise<AdminApiResult<InvoicesPage>> {
  const validated = invoiceQuerySchema.safeParse(query)
  if (!validated.success) {
    return { ok: false, status: 400, message: "The invoice filters are invalid. Enter a valid job ID and page." }
  }

  const response = await adminApiRequest({
    path: "invoices",
    searchParams: validated.data,
    schema: invoicesResponseSchema,
    serviceName: "invoices",
    fallbackMessage: "Billing history could not be loaded.",
  })

  return response.ok ? { ok: true, data: response.data.data } : response
}

export async function getBillingSummary(
  jobId?: string
): Promise<AdminApiResult<BillingSummary>> {
  const parsedJobId = jobId === undefined
    ? { success: true as const, data: undefined }
    : z.string().max(128).uuid().safeParse(jobId)

  if (!parsedJobId.success) {
    return { ok: false, status: 400, message: "The billing summary job ID is invalid." }
  }

  const loadPage = (page: number) => getInvoices({
    page,
    limit: 100,
    status: "PAID",
    jobId: parsedJobId.data,
  })
  const first = await loadPage(1)
  if (!first.ok) return first

  const invoices = [...first.data.invoices]

  // Fetch in small batches so a long billing history does not flood the API.
  for (let page = 2; page <= first.data.pagination.totalPages; page += 4) {
    const pages = Array.from(
      { length: Math.min(4, first.data.pagination.totalPages - page + 1) },
      (_, index) => page + index
    )
    const results = await Promise.all(pages.map(loadPage))
    const failure = results.find((result) => !result.ok)
    if (failure && !failure.ok) return failure

    for (const result of results) {
      if (result.ok) invoices.push(...result.data.invoices)
    }
  }

  const uniqueInvoices = [...new Map(invoices.map((invoice) => [invoice.id, invoice])).values()]
  const totals = new Map<string, BillingSummary["totals"][number]>()

  for (const invoice of uniqueInvoices) {
    const currency = invoice.currency.toUpperCase()
    const group = totals.get(currency) ?? {
      currency,
      paidInvoiceCount: 0,
      grossPaidPence: 0,
      recordedRefundsPence: 0,
      totalEarnedPence: 0,
      supplyEdFeePence: 0,
    }
    const refunded = Math.min(invoice.amountRefundedPence, invoice.totalAmountPence)

    group.paidInvoiceCount += 1
    group.grossPaidPence += invoice.totalAmountPence
    group.recordedRefundsPence += refunded
    group.totalEarnedPence += invoice.totalAmountPence - refunded
    group.supplyEdFeePence += invoice.feeAmountPence
    totals.set(currency, group)
  }

  return {
    ok: true,
    data: {
      paidInvoiceCount: uniqueInvoices.length,
      totals: [...totals.values()].sort((left, right) => left.currency.localeCompare(right.currency)),
    },
  }
}

export async function getJobPayments(
  jobId: string,
  query: Omit<InvoiceQuery, "jobId">
): Promise<AdminApiResult<JobPayments>> {
  const id = z.string().max(128).uuid({ version: "v4" }).safeParse(jobId)
  const validated = invoiceQuerySchema.omit({ jobId: true }).safeParse(query)
  if (!id.success || !validated.success) {
    return { ok: false, status: 400, message: "The job ID or invoice filters are invalid." }
  }

  const response = await adminApiRequest({
    path: `invoices/job/${encodeURIComponent(id.data)}`,
    searchParams: validated.data,
    schema: jobPaymentsResponseSchema,
    serviceName: "invoices",
    fallbackMessage: "Job payments could not be loaded.",
  })

  return response.ok ? { ok: true, data: response.data.data } : response
}
