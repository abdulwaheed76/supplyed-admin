import { z } from "zod"

import { documentContextSchema } from "@/lib/document-requirements/schema"

/**
 * Mirrors `DocumentTypeResponseDto` on the backend. `createdAt` / `updatedAt`
 * are `Date` there but arrive as ISO strings over JSON.
 */
export const documentTypeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  allowedMimes: z.array(z.string()),
  maxSizeBytes: z.number().int().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
})

/** The backend default when `maxSizeBytes` is omitted (10 MB). */
export const DEFAULT_MAX_SIZE_BYTES = 10_485_760

export const MAX_SIZE_BYTES_LIMIT = 104_857_600

/**
 * `type/subtype`, per RFC 6838's restricted-name grammar. The backend only
 * checks that each entry is a non-empty string, so this is the layer that
 * keeps malformed values out of the column.
 */
const mimeTypeSchema = z
  .string()
  .trim()
  .max(150)
  .regex(
    /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i,
    "Enter MIME types in the form type/subtype, e.g. application/pdf."
  )
  .transform((value) => value.toLowerCase())

export const createDocumentTypeInputSchema = z.object({
  // No character rule: the backend takes any non-empty string
  // (`@IsString() @IsNotEmpty()`) into an unbounded unique `text` column, and
  // never uses `code` as a lookup key or URL segment -- it is only ever echoed
  // back in the response. An earlier `[A-Za-z0-9_-]` regex here rejected codes
  // the API would have accepted, so it is gone.
  //
  // Uppercased so the unique `code` column cannot collect DBS/dbs/Dbs. The
  // backend does not normalise, so this only holds for writes from here.
  // The 50-character cap is a table-layout guard matching the form's
  // `maxLength`, not a backend limit.
  code: z
    .string()
    .trim()
    .min(1, "Enter a code.")
    .max(50, "Use 50 characters or fewer for the code.")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  allowedMimes: z
    .array(mimeTypeSchema)
    .min(1, "Select at least one allowed file type.")
    .max(20)
    .refine((items) => new Set(items).size === items.length, {
      message: "Allowed file types must be unique.",
    }),
  maxSizeBytes: z
    .number()
    .int()
    .min(1)
    .max(MAX_SIZE_BYTES_LIMIT)
    .optional(),
  isActive: z.boolean().optional(),
})

export type DocumentType = z.infer<typeof documentTypeSchema>
export type CreateDocumentTypeInput = z.infer<
  typeof createDocumentTypeInputSchema
>

/**
 * What the create form posts to *this app's* route handler — the backend
 * payload plus the requirement settings.
 *
 * The context fields are kept out of `createDocumentTypeInputSchema` on
 * purpose: that schema is forwarded verbatim to `POST /document-types`, and the
 * backend runs `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`,
 * so an unknown `contexts` property there is a 400, not an ignored field. The
 * route handler splits this payload and writes the contexts to
 * `POST /document-requirements` instead.
 */
const documentTypeRequirementSchema = z.object({
  context: documentContextSchema,
  // Required even though the backend columns have defaults: the create form
  // sends a value for all three, substituting a fixed one where it hides the
  // toggle, so a missing field here means the form is wrong rather than the
  // admin having declined to choose.
  isRequired: z.boolean(),
  requiresReview: z.boolean(),
  isActive: z.boolean(),
})

export const createDocumentTypeFormSchema = createDocumentTypeInputSchema.extend(
  {
    requirements: z
      .array(documentTypeRequirementSchema)
      .min(1, "Select at least one context this document applies to.")
      .refine(
        (items) =>
          new Set(items.map((item) => item.context)).size === items.length,
        { message: "Each context can only be added once." }
      ),
  }
)

export type CreateDocumentTypeFormInput = z.infer<
  typeof createDocumentTypeFormSchema
>

/**
 * Mirrors `UpdateDocumentTypeDto extends PartialType(CreateDocumentTypeDto)` —
 * every field optional, omitted fields left untouched.
 *
 * Contexts are deliberately absent: they live on `DocumentRequirement`, and
 * `PATCH /document-types/:id` neither accepts nor returns them. Changing which
 * contexts a type applies to means adding or removing requirement rows, which
 * is a separate operation.
 */
export const updateDocumentTypeInputSchema =
  createDocumentTypeInputSchema.partial()

export type UpdateDocumentTypeInput = z.infer<
  typeof updateDocumentTypeInputSchema
>
