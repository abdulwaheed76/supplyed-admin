"use client"

import { LoaderCircleIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  useCreateDocumentRequirement,
  useDeleteDocumentRequirement,
  useUpdateDocumentRequirement,
} from "@/hooks/use-document-requirements"
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import {
  DOCUMENT_CONTEXTS,
  type DocumentContext,
  type DocumentRequirement,
} from "@/lib/document-requirements/schema"

type DocumentRequirementsPanelProps = {
  documentTypeId: string
  requirements: DocumentRequirement[]
}

/** The toggles a requirement row exposes, in display order. */
const REQUIREMENT_TOGGLES = [
  { field: "isRequired", label: "Required" },
  { field: "requiresReview", label: "Requires review" },
  { field: "isActive", label: "Active" },
] as const

export function DocumentRequirementsPanel({
  documentTypeId,
  requirements,
}: DocumentRequirementsPanelProps) {
  const createRequirement = useCreateDocumentRequirement()
  const updateRequirement = useUpdateDocumentRequirement()
  const deleteRequirement = useDeleteDocumentRequirement()

  // One busy flag for the whole panel: every mutation ends in `router.refresh()`,
  // which re-renders this list, so letting a second edit start mid-refresh would
  // act on rows that are about to be replaced.
  const isPending =
    createRequirement.isPending ||
    updateRequirement.isPending ||
    deleteRequirement.isPending

  const error =
    createRequirement.error ?? updateRequirement.error ?? deleteRequirement.error

  // At most one requirement per context, so the enum's order is a total order.
  const rows = [...requirements].sort(
    (a, b) =>
      DOCUMENT_CONTEXTS.indexOf(a.context) - DOCUMENT_CONTEXTS.indexOf(b.context)
  )

  const linkedContexts = new Set(rows.map((requirement) => requirement.context))
  const availableContexts = DOCUMENT_CONTEXTS.filter(
    (context) => !linkedContexts.has(context)
  )

  function handleAdd(context: DocumentContext) {
    // Only the identity is sent: the columns default to required, not
    // reviewed, and active — and the row's toggles are right there to change.
    createRequirement.mutate({ documentTypeId, context })
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          This document type is not linked to any context yet, so nothing can
          request it. Add one below.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((requirement) => (
            <li
              key={requirement.id}
              className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border p-3"
            >
              <div className="min-w-40 flex-1 font-medium">
                {formatDocumentContext(requirement.context)}
              </div>

              {REQUIREMENT_TOGGLES.map(({ field, label }) => (
                <label
                  key={field}
                  className="flex items-center gap-2 text-sm has-[:disabled]:opacity-50"
                >
                  <input
                    type="checkbox"
                    checked={requirement[field]}
                    disabled={isPending}
                    onChange={(event) =>
                      updateRequirement.mutate({
                        id: requirement.id,
                        input: { [field]: event.target.checked },
                      })
                    }
                    className="size-4 shrink-0 rounded border-input accent-primary"
                  />
                  <span>{label}</span>
                </label>
              ))}

              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isPending}
                onClick={() => deleteRequirement.mutate(requirement.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2Icon aria-hidden="true" />
                <span className="sr-only">
                  Remove {formatDocumentContext(requirement.context)}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : null}

      {availableContexts.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <span className="text-sm text-muted-foreground">Add a context:</span>
          {availableContexts.map((context) => (
            <Button
              key={context}
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => handleAdd(context)}
            >
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {formatDocumentContext(context)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
