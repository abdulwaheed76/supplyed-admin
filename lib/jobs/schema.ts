import { z } from "zod"

export const JOB_STATUSES = ["DRAFT", "ACTIVE", "EXPIRED", "CLOSED"] as const

export const jobStatusSchema = z.enum(JOB_STATUSES)

export const jobSchema = z.object({
  id: z.string(),
  postedByUserId: z.string(),
  title: z.string(),
  description: z.string(),
  subject: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  keyStages: z.array(z.string()),
  parkingInfo: z.string().nullable().optional(),
  payAmount: z.number().nonnegative().nullable().optional(),
  payType: z.string().nullable().optional(),
  status: jobStatusSchema,
  expiresAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional()

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Enter a valid date and time.",
  })
  .optional()

export const createJobInputSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10_000),
    subject: optionalText(200),
    location: optionalText(250),
    startDate: optionalDate,
    endDate: optionalDate,
    keyStages: z
      .array(z.string().trim().min(1).max(100))
      .max(20)
      .refine((items) => new Set(items).size === items.length, {
        message: "Key stages must be unique.",
      }),
    parkingInfo: optionalText(1000),
    payAmount: z.number().nonnegative().optional(),
    payType: z.enum(["hourly", "daily", "fixed"]).optional(),
    expiresAt: optionalDate,
  })
  .superRefine((job, context) => {
    if (
      job.startDate &&
      job.endDate &&
      new Date(job.startDate).getTime() > new Date(job.endDate).getTime()
    ) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "The end date must be on or after the start date.",
      })
    }
  })

export type Job = z.infer<typeof jobSchema>
export type JobStatus = z.infer<typeof jobStatusSchema>
export type CreateJobInput = z.infer<typeof createJobInputSchema>
