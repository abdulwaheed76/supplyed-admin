import { z } from "zod"

import { jobStatusSchema } from "@/lib/jobs/schema"

export const invoiceStatusSchema = z.enum([
  "PENDING",
  "OPEN",
  "PAID",
  "VOID",
  "UNCOLLECTIBLE",
])

const optionalText = z.string().nullish()
const pence = z.number().int().nonnegative()
const invoicePartySchema = z.object({
  id: z.string(),
  userId: optionalText,
  name: optionalText,
})

export const invoiceSchema = z.object({
  id: z.string(),
  createdById: optionalText,
  status: invoiceStatusSchema,
  booking: z.object({
    id: z.string(),
    jobId: z.string(),
    jobTitle: z.string(),
    startDate: optionalText,
    endDate: optionalText,
    instructor: invoicePartySchema,
    institution: invoicePartySchema,
  }),
  payType: z.string(),
  rateAmount: z.number().nonnegative(),
  unitsWorked: z.number().nonnegative().nullish(),
  teacherAmountPence: pence,
  feeAmountPence: pence,
  totalAmountPence: pence,
  currency: z.string().regex(/^[a-zA-Z]{3}$/),
  poNumber: optionalText,
  invoiceNumber: optionalText,
  hostedInvoiceUrl: optionalText,
  invoicePdfUrl: optionalText,
  dueAt: optionalText,
  paidAt: optionalText,
  voidedAt: optionalText,
  amountRefundedPence: pence,
  disputeStatus: optionalText,
  createdAt: z.string(),
  updatedAt: z.string(),
  // These references are provided only by the job audit endpoint.
  stripeInvoiceId: optionalText,
  stripePaymentIntentId: optionalText,
  destinationAccountId: optionalText,
})

export const invoicePaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
})

export const invoicesResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    invoices: z.array(invoiceSchema),
    pagination: invoicePaginationSchema,
  }),
})

export const jobPaymentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: z.object({
      id: z.string(),
      title: z.string(),
      status: jobStatusSchema,
      postedByUserId: z.string(),
    }),
    bookingCount: z.number().int().nonnegative(),
    completedBookingsWithoutInvoice: z.number().int().nonnegative(),
    totalsByStatus: z.array(z.object({
      currency: z.string().regex(/^[a-zA-Z]{3}$/),
      status: invoiceStatusSchema,
      invoiceCount: z.number().int().nonnegative(),
      teacherAmountPence: pence,
      feeAmountPence: pence,
      totalAmountPence: pence,
      amountRefundedPence: pence,
    })),
    invoices: z.array(invoiceSchema),
    pagination: invoicePaginationSchema,
  }),
})

export const invoiceQuerySchema = z.object({
  page: z.number().int().min(1).max(2_147_483_647),
  limit: z.number().int().min(1).max(100),
  status: invoiceStatusSchema.optional(),
  jobId: z.string().max(128).uuid().optional(),
})

export type Invoice = z.infer<typeof invoiceSchema>
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>
export type InvoicePagination = z.infer<typeof invoicePaginationSchema>
export type InvoiceQuery = z.infer<typeof invoiceQuerySchema>
export type JobPayments = z.infer<typeof jobPaymentsResponseSchema>["data"]
export type InvoicesPage = z.infer<typeof invoicesResponseSchema>["data"]

export type BillingSummaryGroup = {
  currency: string
  paidInvoiceCount: number
  grossPaidPence: number
  recordedRefundsPence: number
  totalEarnedPence: number
  supplyEdFeePence: number
}

export type BillingSummary = {
  paidInvoiceCount: number
  totals: BillingSummaryGroup[]
}
