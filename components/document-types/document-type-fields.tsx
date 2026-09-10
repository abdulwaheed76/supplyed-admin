"use client"

import type * as React from "react"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DEFAULT_MAX_SIZE_BYTES,
  type DocumentType,
} from "@/lib/document-types/schema"

/**
 * The complete set of file types a document type can accept. This list is a
 * constraint, not a shortcut -- there is no free-text entry, so accepting a new
 * format means adding it here.
 */
const COMMON_MIME_TYPES = [
  { value: "application/pdf", label: "PDF", hint: "application/pdf" },
  { value: "image/jpeg", label: "JPEG image", hint: "image/jpeg" },
  { value: "image/png", label: "PNG image", hint: "image/png" },
  { value: "image/webp", label: "WebP image", hint: "image/webp" },
  {
    value: "application/msword",
    label: "Word (.doc)",
    hint: "application/msword",
  },
  {
    value:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word (.docx)",
    hint: "…wordprocessingml.document",
  },
] as const

const BYTES_PER_MB = 1_048_576

const DEFAULT_MAX_SIZE_MB = DEFAULT_MAX_SIZE_BYTES / BYTES_PER_MB

export function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string") {
    return undefined
  }

  return value.trim() || undefined
}

/**
 * Reads the fields shared by create and edit. Both forms send the same shape
 * for these; only the context settings and the target endpoint differ.
 */
export function readDocumentTypeFields(formData: FormData) {
  const maxSizeValue = readOptionalText(formData, "maxSizeMb")

  return {
    code: readOptionalText(formData, "code") ?? "",
    name: readOptionalText(formData, "name") ?? "",
    description: readOptionalText(formData, "description"),
    allowedMimes: formData
      .getAll("allowedMimes")
      .filter((mime): mime is string => typeof mime === "string"),
    // The backend stores bytes; admins think in megabytes. Leaving the field
    // blank omits it, so create falls back to the backend default and edit
    // leaves the stored value untouched.
    maxSizeBytes:
      maxSizeValue === undefined
        ? undefined
        : Math.round(Number(maxSizeValue) * BYTES_PER_MB),
    isActive: formData.get("isActive") === "on",
  }
}

type DocumentTypeFieldsProps = {
  isPending: boolean
  /** Prefills the form when editing. Omitted on create. */
  documentType?: DocumentType
  /**
   * Rendered inside the same grid, between the file types and the size limit,
   * so a form can add full-width sections without breaking the two-column
   * layout. Create uses it for the document contexts; edit passes nothing.
   */
  children?: React.ReactNode
}

export function DocumentTypeFields({
  isPending,
  documentType,
  children,
}: DocumentTypeFieldsProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="code">Code</FieldLabel>
        <Input
          id="code"
          name="code"
          placeholder="DBS"
          defaultValue={documentType?.code}
          maxLength={50}
          autoCapitalize="characters"
          className="uppercase"
          disabled={isPending}
          required
        />
        <FieldDescription>
          A unique identifier used by the API. Saved in uppercase.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="name">Name</FieldLabel>
        <Input
          id="name"
          name="name"
          placeholder="DBS Certificate"
          defaultValue={documentType?.name}
          maxLength={200}
          disabled={isPending}
          required
        />
        <FieldDescription>
          The label shown to instructors and institutions.
        </FieldDescription>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          name="description"
          placeholder="Disclosure and Barring Service certificate."
          defaultValue={documentType?.description ?? ""}
          maxLength={1000}
          rows={3}
          disabled={isPending}
        />
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="allowedMimes-application-pdf">
          Allowed file types
        </FieldLabel>
        <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2">
          {COMMON_MIME_TYPES.map(({ value, label, hint }) => (
            <label
              key={value}
              className="flex items-start gap-2.5 text-sm has-[:disabled]:opacity-50"
            >
              <input
                type="checkbox"
                id={`allowedMimes-${value.replace(/[^a-z0-9]+/gi, "-")}`}
                name="allowedMimes"
                value={value}
                defaultChecked={
                  documentType
                    ? documentType.allowedMimes.includes(value)
                    : value === "application/pdf"
                }
                disabled={isPending}
                className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary"
              />
              <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      {children}

      <Field>
        <FieldLabel htmlFor="maxSizeMb">Maximum file size</FieldLabel>
        <Input
          id="maxSizeMb"
          name="maxSizeMb"
          type="number"
          min="1"
          max="100"
          // `any` rather than `1`: a stored value that is not a whole number
          // of megabytes must still prefill without failing step validation.
          step="any"
          inputMode="numeric"
          placeholder={String(DEFAULT_MAX_SIZE_MB)}
          defaultValue={
            documentType ? documentType.maxSizeBytes / BYTES_PER_MB : undefined
          }
          disabled={isPending}
        />
        <FieldDescription>
          In megabytes. Leave blank for the {DEFAULT_MAX_SIZE_MB} MB default.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="isActive">Availability</FieldLabel>
        <label className="flex items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            defaultChecked={documentType ? documentType.isActive : true}
            disabled={isPending}
            className="size-4 shrink-0 rounded border-input accent-primary"
          />
          <span>Active</span>
        </label>
        <FieldDescription>
          Inactive types stay on record but cannot be requested.
        </FieldDescription>
      </Field>
    </div>
  )
}
