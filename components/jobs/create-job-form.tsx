"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircleIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { CreateJobInput } from "@/lib/jobs/schema"

function readOptionalText(formData: FormData, name: string) {
  const value = formData.get(name)

  if (typeof value !== "string") {
    return undefined
  }

  return value.trim() || undefined
}

function readDate(formData: FormData, name: string) {
  const value = readOptionalText(formData, name)

  if (!value) {
    return undefined
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

function readKeyStages(formData: FormData) {
  const value = readOptionalText(formData, "keyStages")

  if (!value) {
    return []
  }

  return [
    ...new Set(
      value
        .split(/[\n,]/)
        .map((stage) => stage.trim())
        .filter(Boolean)
    ),
  ]
}

async function createJob(input: CreateJobInput) {
  const response = await fetch("/api/jobs", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
      signal: AbortSignal.timeout(15_000),
  })
  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Unable to create the job."

    throw new Error(message)
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("job" in body) ||
    !body.job ||
    typeof body.job !== "object" ||
    !("id" in body.job) ||
    typeof body.job.id !== "string"
  ) {
    throw new Error("The job was created, but its details could not be opened.")
  }

  return body.job.id
}

export function CreateJobForm() {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const title = readOptionalText(formData, "title")
    const description = readOptionalText(formData, "description")
    const payAmountValue = readOptionalText(formData, "payAmount")

    if (!title || !description) {
      setError("A title and description are required.")
      return
    }

    const input: CreateJobInput = {
      title,
      description,
      subject: readOptionalText(formData, "subject"),
      location: readOptionalText(formData, "location"),
      startDate: readDate(formData, "startDate"),
      endDate: readDate(formData, "endDate"),
      keyStages: readKeyStages(formData),
      parkingInfo: readOptionalText(formData, "parkingInfo"),
      payAmount: payAmountValue === undefined ? undefined : Number(payAmountValue),
      payType: readOptionalText(formData, "payType") as
        | "hourly"
        | "daily"
        | "fixed"
        | undefined,
      expiresAt: readDate(formData, "expiresAt"),
    }

    setError(null)

    startTransition(async () => {
      try {
        const jobId = await createJob(input)
        router.push(`/dashboard/jobs/${encodeURIComponent(jobId)}`)
        router.refresh()
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "Unable to create the job."
        )
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="title">Job title</FieldLabel>
            <Input
              id="title"
              name="title"
              placeholder="Supply Maths Teacher – Year 9"
              maxLength={200}
              disabled={isPending}
              required
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the role, responsibilities, and requirements."
              maxLength={10_000}
              rows={7}
              disabled={isPending}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input
              id="subject"
              name="subject"
              placeholder="Mathematics"
              maxLength={200}
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              name="location"
              placeholder="London"
              maxLength={250}
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="startDate">Start date and time</FieldLabel>
            <Input
              id="startDate"
              name="startDate"
              type="datetime-local"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="endDate">End date and time</FieldLabel>
            <Input
              id="endDate"
              name="endDate"
              type="datetime-local"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="payAmount">Pay amount</FieldLabel>
            <Input
              id="payAmount"
              name="payAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="180"
              inputMode="decimal"
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="payType">Pay type</FieldLabel>
            <select
              id="payType"
              name="payType"
              defaultValue=""
              disabled={isPending}
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a pay type</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="fixed">Fixed</option>
            </select>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="keyStages">Key stages</FieldLabel>
            <Input
              id="keyStages"
              name="keyStages"
              placeholder="KS3, KS4"
              disabled={isPending}
            />
            <FieldDescription>
              Separate multiple key stages with commas.
            </FieldDescription>
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="parkingInfo">Parking information</FieldLabel>
            <Textarea
              id="parkingInfo"
              name="parkingInfo"
              placeholder="Free staff parking is available on site."
              maxLength={1000}
              rows={3}
              disabled={isPending}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="expiresAt">Listing expiry</FieldLabel>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="datetime-local"
              disabled={isPending}
            />
          </Field>
        </div>

        <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          New jobs are created with the <strong className="font-medium text-foreground">Draft</strong> status.
        </div>

        {error ? <FieldError>{error}</FieldError> : null}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <Button asChild type="button" variant="outline">
            <Link href="/dashboard/jobs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
            ) : null}
            {isPending ? "Creating…" : "Create job"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
