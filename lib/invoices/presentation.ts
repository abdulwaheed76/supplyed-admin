import { invoiceStatusSchema, type InvoiceStatus } from "@/lib/invoices/schema"

const statusLabels: Record<InvoiceStatus, string> = {
  PENDING: "Creating invoice",
  OPEN: "Awaiting payment",
  PAID: "Invoice paid",
  VOID: "Voided",
  UNCOLLECTIBLE: "Uncollectible",
}

export function getInvoiceStatusLabel(status: InvoiceStatus) {
  return statusLabels[status]
}

export function formatInvoiceAmount(amountPence: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountPence / 100)
}

export function formatInvoiceDate(value?: string | null) {
  if (!value) return "Not recorded"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not recorded"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date) + " UTC"
}

export function getInvoiceExternalUrl(value?: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null
  } catch {
    return null
  }
}

export type InvoiceSearchParams = {
  page?: string | string[]
  status?: string | string[]
  jobId?: string | string[]
}

export function parseInvoiceSearchParams(query: InvoiceSearchParams) {
  const first = (value?: string | string[]) => Array.isArray(value) ? value[0] : value
  const page = Number(first(query.page))
  const status = invoiceStatusSchema.safeParse(first(query.status))
  return {
    page: Number.isSafeInteger(page) && page > 0 && page <= 2_147_483_647 ? page : 1,
    limit: 20,
    status: status.success ? status.data : undefined,
    jobId: first(query.jobId)?.trim() || undefined,
  }
}

export function getInvoicesHref(
  basePath: string,
  page: number,
  status?: InvoiceStatus,
  jobId?: string
) {
  const query = new URLSearchParams()
  if (page > 1) query.set("page", String(page))
  if (status) query.set("status", status)
  if (jobId) query.set("jobId", jobId)
  return query.size ? `${basePath}?${query}` : basePath
}
