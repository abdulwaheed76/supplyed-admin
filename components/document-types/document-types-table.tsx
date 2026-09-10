import { FileTypeIcon } from "lucide-react"

import { DocumentTypeRowActions } from "@/components/document-types/document-type-row-actions"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDocumentTypeDate,
  formatMaxSize,
  formatMimeLabel,
  sortDocumentTypes,
} from "@/lib/document-types/presentation"
import type { DocumentType } from "@/lib/document-types/schema"

type DocumentTypesTableProps = {
  documentTypes: DocumentType[]
}

export function DocumentTypesTable({ documentTypes }: DocumentTypesTableProps) {
  const rows = sortDocumentTypes(documentTypes)
  const activeCount = rows.filter((documentType) => documentType.isActive).length

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>All document types</CardTitle>
        <CardDescription>
          {rows.length === 0
            ? "No document types have been created yet."
            : `${rows.length} document ${rows.length === 1 ? "type" : "types"}, ${activeCount} active.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableCaption className="sr-only">
            Document types accepted by the Supplyed platform
          </TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4 md:pl-6">Document type</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Allowed files</TableHead>
              <TableHead>Max size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-4 text-right md:pr-6">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-muted-foreground"
                >
                  <FileTypeIcon
                    aria-hidden="true"
                    className="mx-auto mb-2 size-6 opacity-60"
                  />
                  No document types yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((documentType) => (
                <TableRow key={documentType.id}>
                  <TableCell className="pl-4 md:pl-6">
                    <div className="font-medium">{documentType.name}</div>
                    {documentType.description ? (
                      <div className="max-w-sm truncate text-xs text-muted-foreground">
                        {documentType.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {documentType.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {documentType.allowedMimes.map((mime) => (
                        <span
                          key={mime}
                          title={mime}
                          className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          {formatMimeLabel(mime)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatMaxSize(documentType.maxSizeBytes)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        documentType.isActive
                          ? "inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          : "inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                      }
                    >
                      {documentType.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDocumentTypeDate(documentType.createdAt)}
                  </TableCell>
                  <TableCell className="pr-4 md:pr-6">
                    <DocumentTypeRowActions documentType={documentType} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
