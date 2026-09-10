"use client"

import * as React from "react"
import Link from "next/link"
import { LoaderCircleIcon } from "lucide-react"

import {
  DocumentTypeFields,
  readDocumentTypeFields,
} from "@/components/document-types/document-type-fields"
import { Button } from "@/components/ui/button"
import { FieldError, FieldGroup } from "@/components/ui/field"
import { useUpdateDocumentType } from "@/hooks/use-document-types"
import type { DocumentType } from "@/lib/document-types/schema"

type EditDocumentTypeFormProps = {
  documentType: DocumentType
}

export function EditDocumentTypeForm({
  documentType,
}: EditDocumentTypeFormProps) {
  const updateDocumentType = useUpdateDocumentType()
  const isPending = updateDocumentType.isPending
  const error = updateDocumentType.error

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    // Every field is sent, not just changed ones: the backend's
    // `PartialType` DTO treats an omitted field as "leave alone", and
    // diffing here would silently drop a field an admin deliberately cleared.
    updateDocumentType.mutate({
      id: documentType.id,
      input: readDocumentTypeFields(formData),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <DocumentTypeFields isPending={isPending} documentType={documentType} />

        {error ? <FieldError>{error.message}</FieldError> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard/document-types">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
