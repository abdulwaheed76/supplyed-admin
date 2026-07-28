export const DOCUMENT_REVIEW_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "REQUIRES_INFO",
] as const

export type DocumentReviewStatus =
  (typeof DOCUMENT_REVIEW_STATUSES)[number]

export const DOCUMENT_TYPES = [
  "DBS",
  "ID",
  "ADDRESS_PROOF",
  "QUALIFICATION",
  "INSTITUTION_REGISTRATION",
] as const

export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const DOCUMENT_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const

export type DocumentContentType = (typeof DOCUMENT_CONTENT_TYPES)[number]

export type InstructorDocument = {
  id: string
  instructorId: string
  name: string
  type: DocumentType
  contentType: DocumentContentType
  sizeBytes: number
  uploadedAt?: string | null
  status: DocumentReviewStatus
  reviewNotes?: string | null
  dbsNumber?: string | null
  dbsIssueDate?: string | null
  expiresAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type DocumentQueueItem = {
  document: InstructorDocument
  instructor: {
    profileId: string
    userId: string | null
    fullName: string
  }
}
