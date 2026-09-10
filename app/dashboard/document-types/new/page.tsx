import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { CreateDocumentTypeForm } from "@/components/document-types/create-document-type-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CreateDocumentTypePage() {
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

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add document type
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a document the platform can request and accept.
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
          <CreateDocumentTypeForm />
        </CardContent>
      </Card>
    </div>
  )
}
