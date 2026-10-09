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
  DOCUMENT_TYPE_CONTEXTS,
  type DocumentTypeContext,
} from "@/lib/document-requirements/schema"

/**
 * The per-context settings, matching the toggles on the edit page's
 * requirements panel. A requirement's `isActive` is separate from the document
 * type's own availability -- a type can be active while one context is not.
 */
const REQUIREMENT_TOGGLES = [
  { field: "isRequired", label: "Required" },
  { field: "requiresReview", label: "Requires review" },
  { field: "isActive", label: "Active" },
] as const

type RequirementField = (typeof REQUIREMENT_TOGGLES)[number]["field"]

export function CreateDocumentTypeForm() {
  const createDocumentType = useCreateDocumentType()
  const isPending = createDocumentType.isPending
  const error = createDocumentType.error

  // Tracked in state rather than read from `FormData` at submit time, because
  // the per-context toggles stay disabled until their context is selected.
  const [selectedContexts, setSelectedContexts] = React.useState<
    ReadonlySet<DocumentTypeContext>
  >(new Set())

  function toggleContext(context: DocumentTypeContext, isSelected: boolean) {
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
      requirements: DOCUMENT_TYPE_CONTEXTS.filter((context) =>
        selectedContexts.has(context)
      ).map((context) => {
        const read = (field: RequirementField) =>
          formData.get(`${field}-${context}`) === "on"

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
              {DOCUMENT_TYPE_CONTEXTS.map((context) => {
                const isSelected = selectedContexts.has(context)

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

                    {REQUIREMENT_TOGGLES.map(({ field, label }) => (
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
            {isPending ? "Creating..." : "Create document type"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}