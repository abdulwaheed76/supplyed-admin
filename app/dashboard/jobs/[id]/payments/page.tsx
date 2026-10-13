import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeftIcon, HistoryIcon, MessageSquareIcon } from "lucide-react"

import { InvoiceFilters } from "@/components/invoices/invoice-filters"
import { InvoiceInterpretationNote, InvoiceLoadError, InvoicesSkeleton } from "@/components/invoices/invoice-page-feedback"
import { InvoicesTable } from "@/components/invoices/invoices-table"
import { JobPaymentSummary } from "@/components/invoices/job-payment-summary"
import { RefreshInvoicesButton } from "@/components/invoices/refresh-invoices-button"
import { JobStatusBadge } from "@/components/jobs/job-status-badge"
import { Button } from "@/components/ui/button"
import { getJobPayments } from "@/lib/invoices/get-invoices"
import { parseInvoiceSearchParams, type InvoiceSearchParams } from "@/lib/invoices/presentation"

type JobPaymentsPageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<InvoiceSearchParams>
}

async function JobPaymentsContent({ params, searchParams }: JobPaymentsPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const { page, limit, status } = parseInvoiceSearchParams(query)
  const basePath = `/dashboard/jobs/${encodeURIComponent(id)}/payments`
  const result = await getJobPayments(id, { page, limit, status })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div><Button asChild variant="ghost" size="sm" className="-ml-2"><Link href={`/dashboard/jobs/${encodeURIComponent(id)}`}><ArrowLeftIcon aria-hidden="true" />Back to job</Link></Button></div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Job payments</h1>
          {result.ok ? <div className="mt-2 flex flex-wrap items-center gap-2"><p className="break-words text-sm text-muted-foreground">{result.data.job.title}</p><JobStatusBadge status={result.data.job.status} /></div> : <p className="mt-1 text-sm text-muted-foreground">Invoice history and payment details for this job.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/dashboard/jobs/${encodeURIComponent(id)}/conversations`}><MessageSquareIcon aria-hidden="true" />Chat</Link></Button>
          <Button asChild variant="outline"><Link href="/dashboard/billing-history"><HistoryIcon aria-hidden="true" />Billing history</Link></Button>
          <RefreshInvoicesButton />
        </div>
      </div>
      {result.ok ? <JobPaymentSummary payments={result.data} /> : null}
      <InvoiceFilters basePath={basePath} status={status} />
      {result.ok ? <InvoicesTable invoices={result.data.invoices} pagination={result.data.pagination} basePath={basePath} status={status} audit /> : <InvoiceLoadError status={result.status} message={result.message} />}
      <InvoiceInterpretationNote />
    </div>
  )
}

export default function JobPaymentsPage(props: JobPaymentsPageProps) {
  return <Suspense fallback={<InvoicesSkeleton />}><JobPaymentsContent {...props} /></Suspense>
}
