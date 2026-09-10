"use client"

import * as React from "react"
import Link from "next/link"
import { LoaderCircleIcon } from "lucide-react"

import {
  DocumentTypeFields,
  readDocumentTypeFields,
} from "@/components/document-types/document-type-fields"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { useCreateDocumentType } from "@/hooks/use-document-types"
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import {
  DOCUMENT_CONTEXTS,
  type DocumentContext,
} from "@/lib/document-requirements/schema"

/**
 * The per-context settings, matching the toggles on the edit page's
 * requirements panel. A requirement's `isActive` is separate from the document
 * type's own availability — a type can be active while one context is not.
 */
const REQUIREMENT_TOGGLES = [
  { field: "isRequired", label: "Required" },
  { field: "requiresReview", label: "Requires review" },
  { field: "isActive", label: "Active" },
] as const

type RequirementField = (typeof REQUIREMENT_TOGGLES)[number]["field"]

/**
 * Settings an admin does not choose per context: the toggle is hidden and the
 * value below is sent in its place.
 *
 * Application documents are asked for by the job that needs them, so whether
 * one is mandatory or has to be reviewed is decided there, not on the document
 * type. The values are sent explicitly rather than left to the column defaults
 * so the stored row still states what it means if those defaults ever change.
 */
const FIXED_REQUIREMENT_SETTINGS: Partial<
  Record<
    DocumentContext,
    {
      settings: Partial<Record<RequirementField, boolean>>
      note: string
    }
  >
> = {
  APPLICATION: {
    settings: { isRequired: true, requiresReview: false },
    note: "Set by the job that requests it",
  },
}

export function CreateDocumentTypeForm() {
  const createDocumentType = useCreateDocumentType()
  const isPending = createDocumentType.isPending
  const error = createDocumentType.error

  // Tracked in state rather than read from `FormData` at submit time, because
  // the per-context toggles stay disabled until their context is selected.
  const [selectedContexts, setSelectedContexts] = React.useState<
    ReadonlySet<DocumentContext>
  >(new Set())

  function toggleContext(context: DocumentContext, isSelected: boolean) {
    setSelectedContexts((previous) => {
      const next = new Set(previous)

      if (isSelected) {
        next.add(context)
      } else {
        next.delete(context)
      }

      return next
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    // Shaped here, validated in the route handler so that invalid input and a
    // failed request surface through the same `error`.
    createDocumentType.mutate({
      ...readDocumentTypeFields(formData),
      // One requirement row per selected context, each with its own settings.
      requirements: DOCUMENT_CONTEXTS.filter((context) =>
        selectedContexts.has(context)
      ).map((context) => {
        const fixed = FIXED_REQUIREMENT_SETTINGS[context]?.settings
        const read = (field: RequirementField) =>
          fixed?.[field] ?? formData.get(`${field}-${context}`) === "on"

        return {
          context,
          isRequired: read("isRequired"),
          requiresReview: read("requiresReview"),
          isActive: read("isActive"),
        }
      }),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <DocumentTypeFields isPending={isPending}>
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="contexts-INSTRUCTOR_PROFILE">
              Document requirements
            </FieldLabel>
            <ul className="flex flex-col gap-3">
              {DOCUMENT_CONTEXTS.map((context) => {
                const isSelected = selectedContexts.has(context)
                const fixed = FIXED_REQUIREMENT_SETTINGS[context]
                const toggles = REQUIREMENT_TOGGLES.filter(
                  ({ field }) => !fixed || !(field in fixed.settings)
                )

                return (
                  <li
                    key={context}
                    className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border p-3"
                  >
                    <label className="flex min-w-40 flex-1 items-center gap-2.5 text-sm has-[:disabled]:opacity-50">
                      <input
                        type="checkbox"
                        id={`contexts-${context}`}
                        checked={isSelected}
                        disabled={isPending}
                        onChange={(event) =>
                          toggleContext(context, event.target.checked)
                        }
                        className="size-4 shrink-0 rounded border-input accent-primary"
                      />
                      <span className="font-medium">
                        {formatDocumentContext(context)}
                      </span>
                    </label>

                    {fixed && isSelected ? (
                      <span className="text-xs text-muted-foreground">
                        {fixed.note}
                      </span>
                    ) : null}

                    {toggles.map(({ field, label }) => (
                      <label
                        key={field}
                        className="flex items-center gap-2 text-sm has-[:disabled]:opacity-50"
                      >
                        <input
                          type="checkbox"
                          name={`${field}-${context}`}
                          defaultChecked
                          disabled={isPending || !isSelected}
                          className="size-4 shrink-0 rounded border-input accent-primary"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </li>
                )
              })}
            </ul>
            <FieldDescription>
              Each selected context becomes a document requirement with its own
              settings. You can change these later by editing the document type.
            </FieldDescription>
          </Field>
        </DocumentTypeFields>

        {error ? <FieldError>{error.message}</FieldError> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard/document-types">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Creating…" : "Create document type"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
