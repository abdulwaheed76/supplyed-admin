import type {
  DocumentFileVersion,
  DocumentRecord,
  DocumentVerificationStatus,
} from "@/lib/documents/schema"

const STATUS_LABELS: Record<DocumentVerificationStatus, string> = {
  NOT_REQUIRED: "No review needed",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REQUIRES_INFO: "Requires information",
}

export function getDocumentStatusLabel(status: DocumentVerificationStatus) {
  return STATUS_LABELS[status]
}

export function getDocumentTypeName(document: DocumentRecord) {
  return document.requirement?.documentType.name ?? "Unknown document type"
}

export function getDocumentCurrentFile(
  document: DocumentRecord
): DocumentFileVersion | null {
  if (document.currentVersion) {
    return document.currentVersion
  }

  if (!document.fileKey || !document.contentType || document.sizeBytes == null) {
    return null
  }

  return {
    id: document.currentVersionId ?? document.id,
    documentId: document.id,
    versionNumber: 1,
    fileKey: document.fileKey,
    originalName: document.originalName,
    sizeBytes: document.sizeBytes,
    contentType: document.contentType,
    checksum: document.checksum,
    documentExpiryDate: document.documentExpiryDate,
    createdAt: document.uploadedAt ?? document.updatedAt ?? document.createdAt,
  }
}

/** The uploaded file's own name, falling back to the document type. */
export function getDocumentDisplayName(document: DocumentRecord) {
  const file = getDocumentCurrentFile(document)

  return file?.originalName?.trim() || getDocumentTypeName(document)
}

export function getDocumentOwnerName(document: DocumentRecord) {
  return (
    document.user?.name?.trim() || document.user?.email || "Unknown user"
  )
}

export function formatDocumentFileSize(bytes: number) {
  if (bytes <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )

  return `${new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(bytes / 1024 ** unitIndex)} ${units[unitIndex]}`
}

export function formatDocumentDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}
