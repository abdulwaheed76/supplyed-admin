import type { DocumentContext } from "@/lib/document-requirements/schema"

const CONTEXT_LABELS: Record<DocumentContext, string> = {
  INSTRUCTOR_PROFILE: "Instructor profile",
  INSTITUTION_PROFILE: "Institution profile",
  RECRUITER_PROFILE: "Recruiter profile",
  APPLICATION: "Application",
}

export function formatDocumentContext(context: DocumentContext) {
  return CONTEXT_LABELS[context]
}
