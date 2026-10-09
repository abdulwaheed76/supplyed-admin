import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms and Conditions | Supplyed",
  description: "Terms and conditions for using Supplyed.",
}

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By creating an account, signing in, or using Supplyed, you agree to these Terms and Conditions and any policies referenced by the platform. If you do not agree, do not create an account or use the service.",
  },
  {
    title: "2. Account Responsibilities",
    body: "You are responsible for the accuracy of the information you provide, the security of your login details, and all activity that happens through your account. You must notify Supplyed if you believe your account has been accessed without permission.",
  },
  {
    title: "3. Documents and Profile Information",
    body: "You agree to upload only genuine, accurate, and lawful documents or profile information. Supplyed may review, approve, reject, or request updates to documents where verification is required.",
  },
  {
    title: "4. Acceptable Use",
    body: "You must not misuse the platform, upload harmful content, interfere with the service, attempt unauthorized access, or use Supplyed for fraudulent, unlawful, or misleading activity.",
  },
  {
    title: "5. Jobs, Applications, and Communications",
    body: "Information shown on Supplyed may be provided by users, institutions, instructors, recruiters, or administrators. You are responsible for reviewing details before applying, posting, hiring, or relying on any information.",
  },
  {
    title: "6. Privacy and Data",
    body: "Supplyed uses account, profile, job, and document information to operate the platform, support verification, maintain security, and provide related services. Personal data should be handled according to applicable privacy requirements.",
  },
  {
    title: "7. Suspension or Termination",
    body: "Supplyed may suspend, restrict, or terminate access if an account violates these terms, creates risk for other users, or is suspected of fraudulent or harmful activity.",
  },
  {
    title: "8. Changes to Terms",
    body: "Supplyed may update these Terms and Conditions when the service, legal requirements, or business needs change. Continued use of the platform after updates means you accept the revised terms.",
  },
  {
    title: "9. Contact",
    body: "For questions about these Terms and Conditions, contact the Supplyed support or administration team through the official support channel provided by the platform.",
  },
]

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-svh bg-muted px-6 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-lg border bg-background p-6 shadow-sm md:p-10">
        <header className="flex flex-col gap-3 border-b pb-6">
          <p className="text-sm font-medium text-muted-foreground">Supplyed</p>
          <h1 className="text-3xl font-bold tracking-tight">
            Terms and Conditions
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: October 1, 2026
          </p>
        </header>

        <div className="flex flex-col gap-6 text-sm leading-6 text-muted-foreground">
          <p>
            Please read these terms before creating an account or using
            Supplyed. The checkbox on account creation confirms that you have
            read and agree to these Terms and Conditions.
          </p>

          {sections.map((section) => (
            <section key={section.title} className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {section.title}
              </h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            Public URL: /terms-and-conditions
          </p>
          <Button asChild variant="outline">
            <Link href="/login">Back to login</Link>
          </Button>
        </footer>
      </div>
    </main>
  )
}