"use client"

import { useTransition, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getInvoiceStatusLabel, getInvoicesHref } from "@/lib/invoices/presentation"
import { invoiceStatusSchema, type InvoiceStatus } from "@/lib/invoices/schema"

export function InvoiceFilters({
  basePath,
  status,
  jobId,
  showJobFilter = false,
}: {
  basePath: string
  status?: InvoiceStatus
  jobId?: string
  showJobFilter?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const selected = invoiceStatusSchema.safeParse(form.get("status"))
    const nextJobId = String(form.get("jobId") ?? "").trim() || undefined
    startTransition(() => router.push(getInvoicesHref(basePath, 1, selected.success ? selected.data : undefined, nextJobId)))
  }

  return (
    <Card>
      <CardContent>
        <form key={`${status ?? "all"}:${jobId ?? "all"}`} onSubmit={applyFilters}>
          <fieldset disabled={pending} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="grid gap-1.5 sm:min-w-48">
              <Label htmlFor="invoice-status">Invoice status</Label>
              <select
                id="invoice-status"
                name="status"
                defaultValue={status ?? ""}
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All statuses</option>
                {invoiceStatusSchema.options.map((item) => <option key={item} value={item}>{getInvoiceStatusLabel(item)}</option>)}
              </select>
            </div>
            {showJobFilter ? (
              <div className="grid min-w-0 gap-1.5 sm:w-80">
                <Label htmlFor="invoice-job">Job ID (optional)</Label>
                <Input id="invoice-job" name="jobId" defaultValue={jobId ?? ""} placeholder="Filter by a specific job ID" maxLength={128} className="h-9" />
              </div>
            ) : null}
            <Button type="submit" className="h-9">
              {pending ? <LoaderCircleIcon aria-hidden="true" className="animate-spin" /> : null}
              {pending ? "Applying..." : "Apply filters"}
            </Button>
            <Button asChild variant="ghost" className="h-9"><Link href={basePath}>Clear filters</Link></Button>
          </fieldset>
        </form>
      </CardContent>
    </Card>
  )
}
