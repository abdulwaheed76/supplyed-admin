import { z } from "zod"

export const dropdownNameSchema = z.string().regex(/^[a-z][A-Za-z0-9]*$/)
const key = z.string().regex(/^[a-z0-9][a-z0-9_-]{0,119}$/)
const text = (max: number) => z.string().trim().min(1).max(max)
const unique = <T,>(items: T[]) => new Set(items).size === items.length
export const optionInputSchema = z.object({
  key, value: text(100), label: text(200),
  aliases: z.array(text(100)).max(50).refine(unique, "Aliases must be distinct").optional(),
  group: text(100).nullable().optional(), sortOrder: z.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(), isShared: z.boolean().optional(),
  subjectKeys: z.array(key).max(250).refine(unique, "Subject links must be distinct").optional(),
}).strict()
export const dropdownOptionSchema = optionInputSchema.required()
export const dropdownSummarySchema = z.object({
  id: z.string(), name: dropdownNameSchema, label: z.string(), revision: z.number().int().min(1),
  isActive: z.boolean(), updatedAt: z.string(), optionCount: z.number().int().min(0), expandable: z.boolean(),
})
export const dropdownDetailSchema = dropdownSummarySchema.omit({ optionCount: true }).extend({ options: z.array(dropdownOptionSchema) })
const envelope = <T extends z.ZodType>(data: T) => z.object({ success: z.literal(true), statusCode: z.number(), message: z.string(), data, meta: z.object({ requestId: z.string(), timestamp: z.string(), path: z.string(), method: z.string() }) })
export const dropdownListResponseSchema = envelope(z.object({ dropdowns: z.array(dropdownSummarySchema) }))
export const dropdownResponseSchema = envelope(dropdownDetailSchema)
export const dropdownRouteResponseSchema = z.object({ dropdown: dropdownDetailSchema })
export const dropdownPatchSchema = z.object({
  revision: z.number().int().min(1), label: text(200).optional(), isActive: z.boolean().optional(),
  options: z.array(optionInputSchema).min(1).max(250).refine(items => unique(items.map(item => item.key)), "Duplicate option keys").optional(),
}).strict().refine(data => data.label !== undefined || data.isActive !== undefined || data.options !== undefined, "Choose a change to save")
export const dropdownDeleteSchema = z.object({ revision: z.number().int().min(1), optionKeys: z.array(key).min(1).max(250).refine(unique).optional() }).strict()
export type DropdownSummary = z.infer<typeof dropdownSummarySchema>
export type DropdownDetail = z.infer<typeof dropdownDetailSchema>
export type DropdownOption = z.infer<typeof dropdownOptionSchema>
export type DropdownPatch = z.infer<typeof dropdownPatchSchema>
export type DropdownDelete = z.infer<typeof dropdownDeleteSchema>
