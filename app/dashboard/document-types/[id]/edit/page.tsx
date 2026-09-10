import Link from "next/link"
import { ArrowLeftIcon, RefreshCwIcon } from "lucide-react"

import { DocumentRequirementsPanel } from "@/components/document-types/document-requirements-panel"
import { EditDocumentTypeForm } from "@/components/document-types/edit-document-type-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDocumentRequirements } from "@/lib/document-requirements/get-document-requirements"
import { getDocumentType } from "@/lib/document-types/get-document-type"

type EditDocumentTypePageProps = {
  params: Promise<{ id: string }>
}

export default async function EditDocumentTypePage({
  params,
}: EditDocumentTypePageProps) {
  const { id } = await params
  // Independent reads — the requirements list is useful even if it is empty,
  // and a failure on either is rendered on its own.
  const [result, requirementsResult] = await Promise.all([
    getDocumentType(id),
    getDocumentRequirements(id),
  ])

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/dashboard/document-types">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to document types
          </Link>
        </Button>
      </div>

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load this document type</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/document-types">
                <RefreshCwIcon data-icon="inline-start" />
                Back to the list
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Edit {result.documentType.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update its details, or change which contexts can request it.
            </p>
          </div>

          <Card className="w-full max-w-3xl">
            <CardHeader className="border-b">
              <CardTitle>Document type details</CardTitle>
              <CardDescription>
                Set the identifier, accepted file types, and upload limit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EditDocumentTypeForm documentType={result.documentType} />
            </CardContent>
          </Card>

          <Card className="w-full max-w-3xl">
            <CardHeader className="border-b">
              <CardTitle>Document requirements</CardTitle>
              <CardDescription>
                The contexts this document type applies to. Each row is a
                requirement the platform can ask for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requirementsResult.ok ? (
                <DocumentRequirementsPanel
                  documentTypeId={result.documentType.id}
                  requirements={requirementsResult.requirements}
                />
              ) : (
                <p role="alert" className="text-sm text-destructive">
                  {requirementsResult.message}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
