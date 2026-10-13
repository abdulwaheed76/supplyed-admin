"use client"

import * as React from "react"
import { LoaderCircleIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  useCreateDocumentRequirement,
  useDeleteDocumentRequirement,
  useUpdateDocumentRequirement,
} from "@/hooks/use-document-requirements"
import { formatDocumentContext } from "@/lib/document-requirements/presentation"
import {
  DOCUMENT_TYPE_CONTEXTS,
  type DocumentRequirement,
  type DocumentTypeContext,
  type UpdateDocumentRequirementInput,
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

type RequirementToggleField = (typeof REQUIREMENT_TOGGLES)[number]["field"]

function updateKey(id: string, field: RequirementToggleField) {
  return `update:${id}:${field}`
}

function deleteKey(id: string) {
  return `delete:${id}`
}

function createKey(context: DocumentTypeContext) {
  return `create:${context}`
}

function isDocumentTypeContext(context: DocumentRequirement["context"]): context is DocumentTypeContext {
  return DOCUMENT_TYPE_CONTEXTS.includes(context as DocumentTypeContext)
}

export function DocumentRequirementsPanel({
  documentTypeId,
  requirements,
}: DocumentRequirementsPanelProps) {
  const createRequirement = useCreateDocumentRequirement()
  const updateRequirement = useUpdateDocumentRequirement()
  const deleteRequirement = useDeleteDocumentRequirement()
  const [pendingKeys, setPendingKeys] = React.useState<Set<string>>(
    () => new Set()
  )

  const error =
    createRequirement.error ?? updateRequirement.error ?? deleteRequirement.error

  // At most one requirement per context, so the enum's order is a total order.
  const rows = requirements
    .filter((requirement) => isDocumentTypeContext(requirement.context))
    .sort(
      (a, b) =>
        DOCUMENT_TYPE_CONTEXTS.indexOf(a.context as DocumentTypeContext) -
        DOCUMENT_TYPE_CONTEXTS.indexOf(b.context as DocumentTypeContext)
    )

  const linkedContexts = new Set(rows.map((requirement) => requirement.context))
  const availableContexts = DOCUMENT_TYPE_CONTEXTS.filter(
    (context) => !linkedContexts.has(context)
  )

  function setPending(key: string, pending: boolean) {
    setPendingKeys((current) => {
      const next = new Set(current)

      if (pending) {
        next.add(key)
      } else {
        next.delete(key)
      }

      return next
    })
  }

  function handleAdd(context: DocumentTypeContext) {
    const key = createKey(context)

    setPending(key, true)
    createRequirement.mutate(
      { documentTypeId, context },
      { onSettled: () => setPending(key, false) }
    )
  }

  function handleUpdate(
    id: string,
    field: RequirementToggleField,
    checked: boolean
  ) {
    const key = updateKey(id, field)
    const input: UpdateDocumentRequirementInput = { [field]: checked }

    setPending(key, true)
    updateRequirement.mutate(
      { id, input },
      { onSettled: () => setPending(key, false) }
    )
  }

  function handleDelete(id: string) {
    const key = deleteKey(id)

    setPending(key, true)
    deleteRequirement.mutate(id, { onSettled: () => setPending(key, false) })
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
          {rows.map((requirement) => {
            const rowDeleteKey = deleteKey(requirement.id)
            const isDeleting = pendingKeys.has(rowDeleteKey)

            return (
              <li
                key={requirement.id}
                className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-lg border p-3"
              >
                <div className="min-w-40 flex-1 font-medium">
                  {formatDocumentContext(requirement.context)}
                </div>

                {REQUIREMENT_TOGGLES.map(({ field, label }) => {
                  const key = updateKey(requirement.id, field)
                  const isUpdating = pendingKeys.has(key)

                  return (
                    <label
                      key={field}
                      className="flex items-center gap-2 text-sm has-[:disabled]:opacity-50"
                    >
                      <input
                        type="checkbox"
                        checked={requirement[field]}
                        disabled={isUpdating || isDeleting}
                        onChange={(event) =>
                          handleUpdate(
                            requirement.id,
                            field,
                            event.target.checked
                          )
                        }
                        className="size-4 shrink-0 rounded border-input accent-primary"
                      />
                      <span>{label}</span>
                    </label>
                  )
                })}

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={isDeleting}
                  onClick={() => handleDelete(requirement.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {isDeleting ? (
                    <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2Icon aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    Remove {formatDocumentContext(requirement.context)}
                  </span>
                </Button>
              </li>
            )
          })}
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
          {availableContexts.map((context) => {
            const key = createKey(context)
            const isCreating = pendingKeys.has(key)

            return (
              <Button
                key={context}
                type="button"
                size="sm"
                variant="outline"
                disabled={isCreating}
                onClick={() => handleAdd(context)}
              >
                {isCreating ? (
                  <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
                ) : (
                  <PlusIcon data-icon="inline-start" />
                )}
                {formatDocumentContext(context)}
              </Button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}