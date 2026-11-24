import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeftIcon, DownloadIcon } from "lucide-react"

import {
  DecideIdentityCheckButton,
  ReissueIdentityCheckButton,
  RetryIdentityCheckRetrievalButton,
} from "@/components/identity-checks/identity-check-actions"
import {
  IdentityCheckDecisionBadge,
  IdentityCheckOutcomeBadge,
  IdentityCheckStatusBadge,
} from "@/components/identity-checks/identity-check-badges"
import { DbsCheckCard } from "@/components/dbs-checks/dbs-check-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getDbsCheckForIdentityCheck } from "@/lib/dbs-checks/get-dbs-check"
import { getIdentityCheck } from "@/lib/identity-checks/get-identity-check"
import {
  canReissueIdentityCheck,
  canRetryIdentityCheckRetrieval,
  describeIdentityCheckDecision,
  formatDbsInitiationState,
  formatDocumentAuditorStatus,
  formatEnumLabel,
  formatIdentityCheckDate,
  formatYesNo,
  getIdentityCheckName,
  getIdentityCheckOutcomeGuidance,
} from "@/lib/identity-checks/presentation"

type IdentityCheckPageProps = {
  params: Promise<{ id: string }>
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
      <div>
        <Button asChild size="sm" variant="ghost" className="-ml-2">
          <Link href="/dashboard/identity-checks">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to identity checks
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

export default async function IdentityCheckPage({ params }: IdentityCheckPageProps) {
  const result = await getIdentityCheck((await params).id)

  if (!result.ok) {
    return (
      <Layout>
        <Card role="alert">
          <CardHeader>
            <CardTitle>Unable to load identity check</CardTitle>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    )
  }

  const { check } = result
  const dbsResult = check.status === "COMPLETED" ? await getDbsCheckForIdentityCheck(check.id) : null
  const name = getIdentityCheckName(check)
  const needsDecision = check.needsDecision === true
  const hasLiveLink = check.status === "LINK_SENT" && new Date(check.linkExpiresAt) > new Date()

  return (
    <Layout>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {check.user.email} ·{" "}
            <Link href={`/dashboard/users/${encodeURIComponent(check.user.id)}`} className="underline underline-offset-4">
              View user
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {check.hasReport ? (
            <Button asChild size="sm" variant="outline">
              <a href={`/api/identity-checks/${encodeURIComponent(check.id)}/report`} target="_blank" rel="noreferrer">
                <DownloadIcon data-icon="inline-start" />
                TrustID report
              </a>
            </Button>
          ) : null}
          {canReissueIdentityCheck(check) ? (
            <ReissueIdentityCheckButton
              checkId={check.id}
              teacherName={name}
              hasLiveLink={hasLiveLink}
              needsDecision={needsDecision}
            />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <IdentityCheckStatusBadge status={check.status} />
            <IdentityCheckOutcomeBadge outcome={check.outcome} />
            <IdentityCheckDecisionBadge decision={check.decision} needsDecision={needsDecision} />
          </CardTitle>
          <CardDescription>
            {check.outcome
              ? getIdentityCheckOutcomeGuidance(check.outcome)
              : check.status === "LINK_SENT"
                ? `Waiting for the teacher to complete the TrustID link (expires ${formatIdentityCheckDate(check.linkExpiresAt)}).`
                : check.status === "SUBMITTED"
                  ? "The teacher has submitted. TrustID is processing the check."
                  : check.status === "RESULTS_READY"
                    ? "TrustID has finished. The results are being downloaded."
                    : "This link was not completed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Started">{formatIdentityCheckDate(check.createdAt, true)}</Detail>
            <Detail label="Submitted">{formatIdentityCheckDate(check.submittedAt, true)}</Detail>
            <Detail label="Completed">{formatIdentityCheckDate(check.completedAt, true)}</Detail>
            <Detail label="Sent by">{check.initiatedBy ? (check.initiatedBy.name || check.initiatedBy.email) : "Teacher"}</Detail>
            <Detail label="Teacher consent">
              {check.consentedAt ? formatIdentityCheckDate(check.consentedAt, true) : "Not recorded (link sent by an admin)"}
            </Detail>
            <Detail label="DBS form">{check.hasDbsForm ? "Captured (for the DBS check)" : "Not yet"}</Detail>
          </dl>
          {check.retrievalError ? (
            <div className="mt-4 flex flex-col gap-3 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
              <p role="alert">
                Downloading the results failed {check.retrievalAttempts} time(s): {check.retrievalError}
              </p>
              {canRetryIdentityCheckRetrieval(check) ? <RetryIdentityCheckRetrievalButton checkId={check.id} /> : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {check.status === "COMPLETED" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Right to work</CardTitle>
              <CardDescription>
                {check.shareCodeCheck ? "Checked with a Home Office share code." : "Checked digitally from a British or Irish passport."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Passed">{formatYesNo(check.rightToWorkPassed)}</Detail>
                <Detail label="Status">{formatEnumLabel(check.rightToWorkStatus)}</Detail>
                <Detail label="Follow-up check by">{formatIdentityCheckDate(check.rightToWorkFollowUpDate)}</Detail>
                <Detail label="Work restrictions">{check.rightToWorkRestrictions ?? "—"}</Detail>
              </dl>
              {check.rightToWorkNotes ? (
                <p className="mt-4 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{check.rightToWorkNotes}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity</CardTitle>
              <CardDescription>TrustID&apos;s document, face and liveness checks.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Document">{formatDocumentAuditorStatus(check.documentAuditorStatus)}</Detail>
                <Detail label="Face match">{formatEnumLabel(check.faceMatch)}</Detail>
                <Detail label="Liveness">{formatYesNo(check.livenessPassed)}</Detail>
                <Detail label="Address">{check.addressVerification ?? "—"}</Detail>
                <Detail label="Enhanced DBS identity">{formatYesNo(check.dbsIdentityPassed)}</Detail>
                <Detail label="DBS identity state">{formatDbsInitiationState(check.dbsInitiationState)}</Detail>
              </dl>
              {check.documentNotes ? (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">TrustID analyst notes (not shown to the teacher)</p>
                  <p className="mt-1 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{check.documentNotes}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {needsDecision || check.decision ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Decision <IdentityCheckDecisionBadge decision={check.decision} needsDecision={needsDecision} />
            </CardTitle>
            <CardDescription>
              {needsDecision
                ? "The teacher can't send their profile for review, or be approved, until their identity is verified. Review the TrustID report, then approve or reject it, or send a new link."
                : describeIdentityCheckDecision(check)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {check.decisionNote ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Note (not shown to the teacher)</p>
                <p className="mt-1 whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">{check.decisionNote}</p>
              </div>
            ) : null}
            {needsDecision ? (
              <div className="flex flex-wrap items-center gap-2">
                <DecideIdentityCheckButton checkId={check.id} decision="APPROVED" />
                <DecideIdentityCheckButton checkId={check.id} decision="REJECTED" />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {dbsResult ? (
        <DbsCheckCard
          identityCheck={check}
          teacherName={name}
          dbsCheck={dbsResult.ok ? dbsResult.dbsCheck : null}
          loadError={dbsResult.ok ? undefined : dbsResult.message}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">TrustID container {check.providerContainerId}</p>
    </Layout>
  )
}
