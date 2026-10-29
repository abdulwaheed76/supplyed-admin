import { z } from "zod"

/**
 * Mirrors the `DocumentContext` enum in the backend's Prisma schema. The
 * context lives on `DocumentRequirement`, not on `DocumentType` -- a type is
 * linked to a part of the platform by creating one requirement row per
 * context, keyed `@@unique([documentTypeId, context])` -- so a type can be
 * linked to a context at most once.
 */
export const DOCUMENT_CONTEXTS = [
  "INSTRUCTOR_PROFILE",
  "INSTITUTION_PROFILE",
] as const

export const DOCUMENT_TYPE_CONTEXTS = [
  "INSTRUCTOR_PROFILE",
  "INSTITUTION_PROFILE",
] as const

export const documentContextSchema = z.enum(DOCUMENT_CONTEXTS)
export const documentTypeContextSchema = z.enum(DOCUMENT_TYPE_CONTEXTS)

export type DocumentContext = z.infer<typeof documentContextSchema>
export type DocumentTypeContext = z.infer<typeof documentTypeContextSchema>

/** Mirrors `DocumentRequirementResponseDto`. Dates arrive as ISO strings. */
export const documentRequirementSchema = z.object({
  id: z.string(),
  documentTypeId: z.string(),
  context: documentContextSchema,
  isRequired: z.boolean(),
  requiresReview: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

export type DocumentRequirement = z.infer<typeof documentRequirementSchema>

/**
 * Mirrors `CreateDocumentRequirementDto`. Every setting is optional: the
 * columns carry defaults (`isRequired` true, `requiresReview` false,
 * `isActive` true), so an omitted field takes the backend's value
 * rather than failing validation.
 */
export const createDocumentRequirementInputSchema = z.object({
  documentTypeId: z.uuid(),
  context: documentTypeContextSchema,
  isRequired: z.boolean().optional(),
  requiresReview: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

export type CreateDocumentRequirementInput = z.infer<
  typeof createDocumentRequirementInputSchema
>

/** Mirrors `UpdateDocumentRequirementDto extends PartialType(...)`. */
export const updateDocumentRequirementInputSchema =
  createDocumentRequirementInputSchema.partial()

export type UpdateDocumentRequirementInput = z.infer<
  typeof updateDocumentRequirementInputSchema
>
