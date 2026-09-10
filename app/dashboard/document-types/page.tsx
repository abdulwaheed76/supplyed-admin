import Link from "next/link"
import { PlusIcon, RefreshCwIcon } from "lucide-react"

import { DocumentTypesTable } from "@/components/document-types/document-types-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDocumentTypes } from "@/lib/document-types/get-document-types"

export default async function DocumentTypesPage() {
  const result = await getDocumentTypes()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Document types
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the documents instructors and institutions can upload.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/document-types/new">
            <PlusIcon data-icon="inline-start" />
            Add document type
          </Link>
        </Button>
      </div>

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load document types</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/document-types">
                <RefreshCwIcon data-icon="inline-start" />
                Try again
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DocumentTypesTable documentTypes={result.documentTypes} />
      )}
    </div>
  )
}
