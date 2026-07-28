import { Suspense } from "react"

import { DocumentQueueSkeleton } from "@/components/documents/document-queue-skeleton"
import { DocumentQueueTable } from "@/components/documents/document-queue-table"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getDocumentQueue } from "@/lib/documents/get-document-queue"

const PAGE_SIZE = 20

type DocumentQueuePageProps = {
  searchParams: Promise<{ page?: string | string[] }>
}

function getPageNumber(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  const page = Number(candidate)

  return Number.isInteger(page) && page > 0 ? page : 1
}

async function DocumentQueueContent({
  searchParams,
}: DocumentQueuePageProps) {
  const page = getPageNumber((await searchParams).page)
  const result = await getDocumentQueue({ page, limit: PAGE_SIZE })

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Document queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review every instructor document and track its verification status.
        </p>
      </div>

      {!result.ok ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load document queue</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <DocumentQueueTable
          items={result.items}
          pagination={result.pagination}
          unresolvedInstructorCount={result.unresolvedInstructorCount}
        />
      )}
    </div>
  )
}

export default function DocumentQueuePage(props: DocumentQueuePageProps) {
  return (
    <Suspense fallback={<DocumentQueueSkeleton />}>
      <DocumentQueueContent {...props} />
    </Suspense>
  )
}
