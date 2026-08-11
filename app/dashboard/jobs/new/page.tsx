import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { CreateJobForm } from "@/components/jobs/create-job-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function CreateJobPage() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/dashboard/jobs">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to jobs
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create job</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new job posting to the Supplyed platform.
        </p>
      </div>

      <Card className="w-full max-w-4xl">
        <CardHeader className="border-b">
          <CardTitle>Job details</CardTitle>
          <CardDescription>
            Enter the role, schedule, pay, and placement information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateJobForm />
        </CardContent>
      </Card>
    </div>
  )
}
