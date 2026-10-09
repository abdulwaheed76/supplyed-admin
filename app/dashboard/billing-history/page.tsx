import { Suspense } from "react"

import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { BillingSummary } from "@/components/invoices/billing-summary"
import { InvoiceInterpretationNote, InvoiceLoadError, InvoicesSkeleton } from "@/components/invoices/invoice-page-feedback"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { RefreshInvoicesButton } from "@/components/invoices/refresh-invoices-button"
import { getBillingSummary, getInvoices } from "@/lib/invoices/get-invoices"
import { parseInvoiceSearchParams, type InvoiceSearchParams } from "@/lib/invoices/presentation"

type BillingHistoryPageProps = { searchParams: Promise<InvoiceSearchParams> }

async function BillingHistoryContent({ searchParams }: BillingHistoryPageProps) {
  const filters = parseInvoiceSearchParams(await searchParams)
  const [result, summary] = await Promise.all([
    getInvoices(filters),
    getBillingSummary(filters.jobId),
  ])
  const basePath = "/dashboard/billing-history"

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Billing History</h1><p className="mt-1 text-sm text-muted-foreground">Review invoices across all jobs, including billed schools, instructors, refunds and disputes.</p></div>
        <RefreshInvoicesButton />
      </div>
      {summary.ok ? (
        <BillingSummary summary={summary.data} filteredByJob={Boolean(filters.jobId)} />
      ) : (
        <InvoiceLoadError status={summary.status} message={summary.message} />
      )}
      <InvoiceFilters basePath={basePath} status={filters.status} jobId={filters.jobId} showJobFilter />
      {result.ok ? <InvoicesTable invoices={result.data.invoices} pagination={result.data.pagination} basePath={basePath} status={filters.status} jobId={filters.jobId} /> : <InvoiceLoadError status={result.status} message={result.message} />}
      <InvoiceInterpretationNote />
    </div>
  )
}

export default function BillingHistoryPage(props: BillingHistoryPageProps) {
  return <Suspense fallback={<InvoicesSkeleton />}><BillingHistoryContent {...props} /></Suspense>
}
