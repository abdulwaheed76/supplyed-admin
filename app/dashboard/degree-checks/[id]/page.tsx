import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon } from "lucide-react"

import {
  CancelDegreeCheckButton,
  DecideDegreeCheckButton,
  TestVerifyDegreeCheckButton,
} from "@/components/degree-checks/degree-check-actions"
import { DegreeCheckStatusBadge, NeedsActionBadge } from "@/components/degree-checks/degree-check-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getDegreeCheck } from "@/lib/degree-checks/get-degree-checks"
import {
  formatCorrectionValue,
  formatDegreeCheckDay,
  formatVerifiedDegree,
  getCorrectionLabel,
  getDegreeCheckName,
} from "@/lib/degree-checks/presentation"
import type { DegreeCheck } from "@/lib/degree-checks/schema"
import { formatIdentityCheckDate } from "@/lib/identity-checks/presentation"
import { cn } from "@/lib/utils"

type DegreeCheckPageProps = {
  params: Promise<{ id: string }>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/dashboard/degree-checks">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to degree checks
          </Link>
        </Button>
      </div>
      {children}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

/** What the admin is asked to do, or where the check stands. */
function describe(check: DegreeCheck) {
  switch (check.status) {
    case "UNCONFIRMED":
      return `Hedd's answer to sending this check never arrived, so Hedd may or may not have it. Look for reference ${check.id} on the Hedd dashboard. If Hedd doesn't have it, cancel it so the teacher can start again.`
    case "WAITING":
      return `With the university. Hedd is asked for news every 6 hours${check.dueDate ? `; the university is due to answer by ${formatDegreeCheckDay(check.dueDate)}` : ""}.`
    case "MORE_INFORMATION":
      return `The university wants more information (see notes). Answer it on the Hedd website, Hedd reference ${check.heddReference ?? "—"}.`
    case "CANCELLED":
      return "Closed by the university, Hedd or an admin. The teacher can start a new check."
    case "VERIFIED":
      if (check.decision === "APPROVED") {
        return check.decidedBy
          ? `Approved by ${check.decidedBy.name || check.decidedBy.email} on ${formatIdentityCheckDate(check.decidedAt, true)}. Schools see the degree as verified.`
          : "The university confirmed it without corrections, so schools see the degree as verified."
      }

      if (check.decision === "REJECTED") {
        return `Rejected${check.decidedBy ? ` by ${check.decidedBy.name || check.decidedBy.email}` : ""} on ${formatIdentityCheckDate(check.decidedAt, true)}. Schools don't see a verified degree.`
      }

      return "The university verified the degree but corrected some details. Compare them below, then approve or reject. Approving shows the degree to schools with the university's corrected values."
  }
}

export default async function DegreeCheckPage({ params }: DegreeCheckPageProps) {
  const result = await getDegreeCheck((await params).id)

  if (!result.ok) {
    return (
      <Layout>
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load degree check</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    )
  }

  const { check } = result
  const corrections = Object.entries(check.corrections ?? {})

  return (
    <Layout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{getDegreeCheckName(check)}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {check.user.email} ·{" "}
            <Link href={`/dashboard/users/${encodeURIComponent(check.user.id)}`} className="underline underline-offset-4">
              View user
            </Link>
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={`/api/degree-checks/${encodeURIComponent(check.id)}/consent`} target="_blank" rel="noreferrer">
            <DownloadIcon data-icon="inline-start" />
            Consent form
          </a>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Degree check (Hedd) <DegreeCheckStatusBadge check={check} />
            {check.needsAction ? <NeedsActionBadge /> : null}
            {check.live ? null : (
              <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                Hedd test API
              </span>
            )}
          </CardTitle>
          <CardDescription>{describe(check)}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {check.degree ? (
            <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
              Schools see: {formatVerifiedDegree(check.degree)}
            </p>
          ) : null}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Hedd reference">{check.heddReference ?? "—"}</Detail>
            <Detail label="Hedd enquiry ID">
              <span className="break-all">{check.heddGuid ?? "—"}</span>
            </Detail>
            <Detail label="Our reference">
              <span className="break-all">{check.id}</span>
            </Detail>
            <Detail label="Sent">{formatIdentityCheckDate(check.createdAt, true)}</Detail>
            <Detail label="Due">{formatDegreeCheckDay(check.dueDate)}</Detail>
            <Detail label="Last asked Hedd">{formatIdentityCheckDate(check.lastCheckedAt, true)}</Detail>
            <Detail label="Verified on">{formatDegreeCheckDay(check.verifiedOn)}</Detail>
            <Detail label="Attended">
              {check.attendanceFrom || check.attendanceTo
                ? `${formatDegreeCheckDay(check.attendanceFrom)} – ${formatDegreeCheckDay(check.attendanceTo)}`
                : "—"}
            </Detail>
          </dl>
          {check.notes ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {check.status === "CANCELLED" ? "Notes (shown to the teacher)" : "Hedd's notes"}
              </p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{check.notes}</p>
            </div>
          ) : null}
          {check.decisionNote ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note (not shown to the teacher)</p>
              <p className="mt-1 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{check.decisionNote}</p>
            </div>
          ) : null}
          {check.status === "VERIFIED" && !check.decision ? (
            <div className="flex flex-wrap items-center gap-2">
              <DecideDegreeCheckButton checkId={check.id} decision="APPROVED" />
              <DecideDegreeCheckButton checkId={check.id} decision="REJECTED" />
            </div>
          ) : null}
          {check.status === "UNCONFIRMED" || check.status === "WAITING" || check.status === "MORE_INFORMATION" ? (
            <div className="flex flex-wrap items-center gap-2">
              <TestVerifyDegreeCheckButton checkId={check.id} />
              {check.status === "UNCONFIRMED" ? <CancelDegreeCheckButton checkId={check.id} /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What was sent</CardTitle>
          <CardDescription>The name and date of birth come from the teacher&apos;s verified identity; the degree is as they entered it.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="First names">{check.firstNames}</Detail>
            <Detail label="Last name">{check.lastName}</Detail>
            <Detail label="Last name at time of study">{check.lastNameAtStudy ?? "Same"}</Detail>
            <Detail label="Date of birth">{formatDegreeCheckDay(check.dateOfBirth)}</Detail>
            <Detail label="University">{check.institutionName}</Detail>
            <Detail label="Course">{check.courseName}</Detail>
            <Detail label="Qualification">{check.qualificationType}</Detail>
            <Detail label="Classification">{check.classification}</Detail>
            <Detail label="Year of award">{check.yearOfAward}</Detail>
          </dl>
        </CardContent>
      </Card>

      {corrections.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Corrections</CardTitle>
            <CardDescription>What the university says is wrong in what was sent, and its own record.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4 md:pl-6">Field</TableHead>
                  <TableHead className="pr-4 md:pr-6">University&apos;s record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corrections.map(([field, value]) => (
                  <TableRow key={field}>
                    <TableCell className="pl-4 font-medium md:pl-6">{getCorrectionLabel(field)}</TableCell>
                    <TableCell className={cn("whitespace-normal pr-4 md:pr-6", (value ?? "") === "" && "text-muted-foreground")}>
                      {formatCorrectionValue(value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </Layout>
  )
}
