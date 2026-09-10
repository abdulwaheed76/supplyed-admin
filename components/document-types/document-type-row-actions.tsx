"use client"

import * as React from "react"
import Link from "next/link"
import { LoaderCircleIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useDeleteDocumentType } from "@/hooks/use-document-types"
import type { DocumentType } from "@/lib/document-types/schema"

type DocumentTypeRowActionsProps = {
  documentType: DocumentType
}

export function DocumentTypeRowActions({
  documentType,
}: DocumentTypeRowActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const deleteDocumentType = useDeleteDocumentType()
  const isPending = deleteDocumentType.isPending

  function handleOpenChange(open: boolean) {
    // Clear a previous failure so reopening the dialog does not show a stale
    // message from the last attempt.
    if (!open) {
      deleteDocumentType.reset()
    }

    setIsOpen(open)
  }

  function handleDelete() {
    deleteDocumentType.mutate(documentType.id, {
      onSuccess: () => setIsOpen(false),
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild size="icon" variant="ghost">
        <Link href={`/dashboard/document-types/${documentType.id}/edit`}>
          <PencilIcon aria-hidden="true" />
          <span className="sr-only">Edit {documentType.name}</span>
        </Link>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2Icon aria-hidden="true" />
            <span className="sr-only">Delete {documentType.name}</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {documentType.name}?</DialogTitle>
            <DialogDescription>
              This permanently removes the {documentType.code} document type.
              Types already linked to a context cannot be deleted until their
              document requirements are removed.
            </DialogDescription>
          </DialogHeader>

          {deleteDocumentType.error ? (
            <p role="alert" className="text-sm text-destructive">
              {deleteDocumentType.error.message}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
