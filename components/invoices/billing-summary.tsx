import { CirclePoundSterlingIcon, ReceiptTextIcon, RotateCcwIcon, WalletCardsIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatInvoiceAmount } from "@/lib/invoices/presentation"
import type { BillingSummary as BillingSummaryData } from "@/lib/invoices/schema"

function Amounts({
  summary,
  field,
}: {
  summary: BillingSummaryData
  field: "totalEarnedPence" | "grossPaidPence" | "recordedRefundsPence" | "supplyEdFeePence"
}) {
  if (summary.totals.length === 0) {
    return <span>{formatInvoiceAmount(0, "GBP")}</span>
  }

  return (
    <span className="flex flex-col gap-1">
      {summary.totals.map((total) => (
        <span key={total.currency}>
          {formatInvoiceAmount(total[field], total.currency)}
        </span>
      ))}
    </span>
  )
}

export function BillingSummary({
  summary,
  filteredByJob = false,
}: {
  summary: BillingSummaryData
  filteredByJob?: boolean
}) {
  const cards = [
    {
      label: "Total amount earned",
      field: "totalEarnedPence" as const,
      description: "Paid invoice value after recorded refunds",
      Icon: CirclePoundSterlingIcon,
    },
    {
      label: "Gross paid",
      field: "grossPaidPence" as const,
      description: `${summary.paidInvoiceCount.toLocaleString("en-GB")} paid invoice${summary.paidInvoiceCount === 1 ? "" : "s"}`,
      Icon: WalletCardsIcon,
    },
    {
      label: "Recorded refunds",
      field: "recordedRefundsPence" as const,
      description: "Refund requests recorded against paid invoices",
      Icon: RotateCcwIcon,
    },
    {
      label: "SupplyEd fees",
      field: "supplyEdFeePence" as const,
      description: "Fee portion before refund and provider costs",
      Icon: ReceiptTextIcon,
    },
  ]

  return (
    <section aria-labelledby="billing-summary-title" className="space-y-3">
      <div>
        <h2 id="billing-summary-title" className="text-lg font-semibold">Earnings summary</h2>
        <p className="text-sm text-muted-foreground">
          {filteredByJob ? "Paid invoices for the selected job." : "Paid invoices across the complete billing history."}
          {summary.totals.length > 1 ? " Amounts in different currencies are kept separate." : ""}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, field, description, Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums"><Amounts summary={summary} field={field} /></p>
              <CardDescription className="mt-1">{description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
