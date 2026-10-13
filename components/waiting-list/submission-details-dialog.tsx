"use client"

import * as React from "react"
import { EyeIcon, LoaderCircleIcon } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { SubmissionStatusBadge } from "@/components/waiting-list/submission-status-badge"
import { useUpdateSubmissionStatus } from "@/hooks/use-waiting-list"
import {
  formatSubmissionDate,
  getSubmissionStatusLabel,
  getSubmissionTypeLabel,
} from "@/lib/waiting-list/presentation"
import {
  submissionStatusSchema,
  type SubmissionStatus,
  type WaitingListSubmission,
} from "@/lib/waiting-list/schema"

function Detail({
  label,
  value,
  children,
}: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words whitespace-pre-wrap text-sm">
        {children ?? (value?.trim() ? value : "Not provided")}
      </dd>
    </div>
  )
}

export function SubmissionDetailsDialog({
  submission,
}: {
  submission: WaitingListSubmission
}) {
  const statusId = React.useId()
  const [open, setOpen] = React.useState(false)
  const [status, setStatus] = React.useState(submission.status)
  const [savedSubmission, setSavedSubmission] =
    React.useState<WaitingListSubmission | null>(null)
  const updateStatus = useUpdateSubmissionStatus()

  // Keep the complete PATCH result visible while the server list refreshes,
  // but accept any newer submission received from the server afterwards.
  const currentSubmission =
    savedSubmission &&
    Date.parse(savedSubmission.updatedAt) >= Date.parse(submission.updatedAt)
      ? savedSubmission
      : submission
  const isSchool = currentSubmission.type === "SCHOOL"
  const isPending = updateStatus.isPending
  const hasChanged = status !== currentSubmission.status

  function handleOpenChange(nextOpen: boolean) {
    if (isPending) return

    if (nextOpen) {
      setStatus(currentSubmission.status)
      updateStatus.reset()
    }

    setOpen(nextOpen)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending || !hasChanged) return

    updateStatus.mutate(
      { id: currentSubmission.id, status },
      {
        onSuccess: (updated) => {
          setSavedSubmission(updated)
          setStatus(updated.status)
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <EyeIcon aria-hidden="true" />
          Details
          <span className="sr-only"> for {submission.name}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-5 pr-12">
          <DialogTitle>Waiting list submission</DialogTitle>
          <DialogDescription>
            Review {currentSubmission.name}&apos;s details and update their
            status.
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm font-medium">
              {getSubmissionTypeLabel(currentSubmission.type)}
            </span>
            <SubmissionStatusBadge status={currentSubmission.status} />
          </div>
        </DialogHeader>

        <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5">
          <section aria-label="Contact details" className="space-y-3">
            <h3 className="text-sm font-semibold">Contact details</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Name" value={currentSubmission.name} />
              <Detail label="Email">
                <a
                  href={`mailto:${currentSubmission.email}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {currentSubmission.email}
                </a>
              </Detail>
              <Detail label="Phone" value={currentSubmission.phone} />
              <Detail label="Role" value={currentSubmission.role} />
              <Detail label="Area" value={currentSubmission.area} />
              <Detail
                label="Postcode area"
                value={currentSubmission.postcode}
              />
            </dl>
          </section>

          <section
            aria-label="Interest details"
            className="space-y-3 border-t pt-5"
          >
            <h3 className="text-sm font-semibold">
              {isSchool ? "School details" : "Teacher details"}
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              {isSchool || currentSubmission.organizationName ? (
                <Detail
                  label="Organization"
                  value={currentSubmission.organizationName}
                />
              ) : null}
              {isSchool || currentSubmission.schoolType ? (
                <Detail
                  label="School type"
                  value={currentSubmission.schoolType}
                />
              ) : null}
              {isSchool ? (
                <>
                  <Detail
                    label="Supply days per term"
                    value={currentSubmission.supplyDaysPerTerm}
                  />
                  <Detail
                    label="Current cover booking"
                    value={currentSubmission.coverBookingMethod}
                  />
                  <Detail
                    label="Founding programme interest"
                    value={
                      currentSubmission.foundingProgrammeInterest == null
                        ? null
                        : currentSubmission.foundingProgrammeInterest
                          ? "Yes"
                          : "No"
                    }
                  />
                </>
              ) : (
                <>
                  <Detail
                    label="Current supply work"
                    value={currentSubmission.currentSupply}
                  />
                  <Detail
                    label="Days wanted per week"
                    value={currentSubmission.daysPerWeek}
                  />
                  <Detail
                    label="Launch email consent"
                    value={
                      currentSubmission.emailConsent == null
                        ? null
                        : currentSubmission.emailConsent
                          ? "Yes"
                          : "No"
                    }
                  />
                  <Detail
                    label="Teaching phases"
                    value={currentSubmission.phases.join(", ")}
                  />
                  <Detail
                    label="Main subject"
                    value={currentSubmission.mainSubject}
                  />
                </>
              )}
              {currentSubmission.tier ? (
                <Detail
                  label="Tier (previous form)"
                  value={currentSubmission.tier}
                />
              ) : null}
              {currentSubmission.phase ? (
                <Detail label="Phase" value={currentSubmission.phase} />
              ) : null}
              {currentSubmission.availability ? (
                <Detail
                  label="Availability"
                  value={currentSubmission.availability}
                />
              ) : null}
            </dl>
          </section>

          <section aria-label="Message" className="space-y-3 border-t pt-5">
            <h3 className="text-sm font-semibold">Message</h3>
            <p className="break-words rounded-lg bg-muted/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {currentSubmission.message?.trim()
                ? currentSubmission.message
                : "No message provided."}
            </p>
          </section>

          <section
            aria-label="Submission information"
            className="space-y-3 border-t pt-5"
          >
            <h3 className="text-sm font-semibold">Submission information</h3>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Source" value={currentSubmission.source} />
              <Detail label="Campaign" value={currentSubmission.campaign} />
              <Detail
                label="Submitted"
                value={formatSubmissionDate(currentSubmission.createdAt, true)}
              />
              <Detail
                label="Last updated"
                value={formatSubmissionDate(currentSubmission.updatedAt, true)}
              />
              <div className="sm:col-span-2">
                <Detail label="Submission ID" value={currentSubmission.id} />
              </div>
            </dl>
          </section>
        </div>

        <form
          className="grid gap-3 border-t bg-muted/20 px-5 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-2">
            <Label htmlFor={statusId}>Status</Label>
            <select
              id={statusId}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as SubmissionStatus)
                updateStatus.reset()
              }}
              disabled={isPending}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submissionStatusSchema.options.map((option) => (
                <option key={option} value={option}>
                  {getSubmissionStatusLabel(option)}
                </option>
              ))}
            </select>
          </div>

          {updateStatus.error ? (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {updateStatus.error.message}
            </p>
          ) : null}
          {updateStatus.isSuccess ? (
            <p
              role="status"
              className="text-sm text-emerald-700 dark:text-emerald-400"
            >
              Status updated to{" "}
              {getSubmissionStatusLabel(currentSubmission.status)}.
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending || !hasChanged}>
              {isPending ? (
                <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? "Saving..." : "Save status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
