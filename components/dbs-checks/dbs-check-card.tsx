import type { ReactNode } from "react"
import { DownloadIcon } from "lucide-react"

import { DecideDbsCheckButton, SendDbsCheckButton } from "@/components/dbs-checks/dbs-check-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DbsCheck } from "@/lib/dbs-checks/schema"
import { formatIdentityCheckDate } from "@/lib/identity-checks/presentation"
import type { IdentityCheck } from "@/lib/identity-checks/schema"
import { cn } from "@/lib/utils"

const pill = "inline-flex rounded-full px-2 py-1 text-xs font-medium"

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

function DbsCheckBadge({ dbsCheck }: { dbsCheck: DbsCheck }) {
  if (dbsCheck.decision === "APPROVED") {
    return <span className={cn(pill, "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400")}>DBS verified</span>
  }

  if (dbsCheck.decision === "REJECTED") {
    return <span className={cn(pill, "bg-destructive/10 text-destructive")}>DBS rejected</span>
  }

  if (dbsCheck.needsDecision) {
    return <span className={cn(pill, "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>See the certificate</span>
  }

  if (dbsCheck.status === "SEND_FAILED") {
    return <span className={cn(pill, "bg-destructive/10 text-destructive")}>Not sent</span>
  }

  return <span className={cn(pill, "bg-sky-500/10 text-sky-700 dark:text-sky-400")}>With the DBS</span>
}

function describe(dbsCheck: DbsCheck) {
  if (dbsCheck.status === "SEND_FAILED") {
    return "It could not be sent to uCheck automatically, for the reasons below. Once they are dealt with, send it again."
  }

  if (dbsCheck.status === "SUBMITTED") {
    return "uCheck has the application and is waiting for the DBS. The result is collected automatically (checked every 11 minutes)."
  }

  if (dbsCheck.needsDecision) {
    return "uCheck says the certificate has content. Ask the teacher to show you the certificate the DBS posted to them (only they receive it), then approve or reject."
  }

  if (dbsCheck.decision === "APPROVED") {
    return dbsCheck.decidedBy
      ? `Approved by ${dbsCheck.decidedBy.name || dbsCheck.decidedBy.email} on ${formatIdentityCheckDate(dbsCheck.decidedAt)}. The teacher's DBS counts as verified.`
      : "The certificate is clear, so the teacher's DBS counts as verified."
  }

  return `Rejected${dbsCheck.decidedBy ? ` by ${dbsCheck.decidedBy.name || dbsCheck.decidedBy.email}` : ""} on ${formatIdentityCheckDate(dbsCheck.decidedAt)}.`
}

/**
 * The Enhanced DBS check for an identity check. It is sent to uCheck
 * automatically once the identity is approved; this shows where it stands
 * and its result, and lets an admin send one that could not be sent.
 */
export function DbsCheckCard({
  identityCheck,
  teacherName,
  dbsCheck,
  loadError,
}: {
  identityCheck: IdentityCheck
  teacherName: string
  dbsCheck: DbsCheck | null
  loadError?: string
}) {
  if (loadError) {
    return (
      <Card role="alert">
        <CardHeader>
          <CardTitle>DBS check</CardTitle>
          <CardDescription>{loadError}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!dbsCheck) {
    const approved = identityCheck.decision === "APPROVED"

    return (
      <Card>
        <CardHeader>
          <CardTitle>DBS check (uCheck)</CardTitle>
          <CardDescription>
            {approved
              ? "Being sent to uCheck automatically (within a minute of approval); refresh to see it. It is built from the DBS form the teacher filled in on TrustID."
              : "Sent to uCheck automatically once the identity check is approved: uCheck is told the identity was verified."}
          </CardDescription>
        </CardHeader>
        {approved ? (
          <CardContent className="flex flex-col items-start gap-3">
            {identityCheck.hasDbsForm ? null : (
              <p className="text-sm text-muted-foreground">
                No DBS form is stored for this check yet; checking the application fetches it from TrustID.
              </p>
            )}
            <SendDbsCheckButton identityCheckId={identityCheck.id} teacherName={teacherName} label="Send now" />
          </CardContent>
        ) : null}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="grid gap-1.5">
            <CardTitle className="flex flex-wrap items-center gap-2">
              DBS check (uCheck) <DbsCheckBadge dbsCheck={dbsCheck} />
              {dbsCheck.live ? null : (
                <span className={cn(pill, "bg-muted text-muted-foreground")}>uCheck test system</span>
              )}
            </CardTitle>
            <CardDescription>{describe(dbsCheck)}</CardDescription>
          </div>
          {dbsCheck.status === "SEND_FAILED" ? (
            <SendDbsCheckButton identityCheckId={identityCheck.id} teacherName={teacherName} label="Send again" />
          ) : null}
          {dbsCheck.hasReport ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/api/dbs-checks/${encodeURIComponent(dbsCheck.id)}/report`} target="_blank" rel="noreferrer">
                <DownloadIcon data-icon="inline-start" />
                uCheck report
              </a>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {dbsCheck.sendProblems.length ? (
          <ul role="alert" className="list-disc rounded-lg bg-destructive/10 py-2 pl-8 pr-3 text-sm text-destructive">
            {dbsCheck.sendProblems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        ) : null}
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="uCheck reference">{dbsCheck.ucheckReference ?? "—"}</Detail>
          <Detail label="Sent">{formatIdentityCheckDate(dbsCheck.submittedAt, true)}</Detail>
          <Detail label="Sent by">
            {dbsCheck.submittedBy ? dbsCheck.submittedBy.name || dbsCheck.submittedBy.email : "Automatically"}
          </Detail>
          <Detail label="Evidence checked by">{dbsCheck.evidenceCheckedBy}</Detail>
          <Detail label="Result">
            {dbsCheck.result === "CLEAR" ? "Clear" : dbsCheck.result === "SEE_CERTIFICATE" ? "Certificate has content" : "—"}
          </Detail>
          <Detail label="Result received">{formatIdentityCheckDate(dbsCheck.resultAt, true)}</Detail>
          <Detail label="Certificate number">{dbsCheck.disclosureNumber ?? "—"}</Detail>
          <Detail label="Certificate issued">{formatIdentityCheckDate(dbsCheck.disclosureIssuedAt)}</Detail>
        </dl>
        {dbsCheck.decisionNote ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note (not shown to the teacher)</p>
            <p className="mt-1 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{dbsCheck.decisionNote}</p>
          </div>
        ) : null}
        {dbsCheck.needsDecision ? (
          <div className="flex flex-wrap items-center gap-2">
            <DecideDbsCheckButton dbsCheckId={dbsCheck.id} decision="APPROVED" />
            <DecideDbsCheckButton dbsCheckId={dbsCheck.id} decision="REJECTED" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
