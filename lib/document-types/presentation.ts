import type { DocumentType } from "@/lib/document-types/schema"

/** Friendly labels for the MIME types the platform handles most often. */
const MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
  "image/heic": "HEIC",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
}

export function formatMimeLabel(mime: string) {
  const normalized = mime.trim().toLowerCase()

  return MIME_LABELS[normalized] ?? normalized
}

export function formatMaxSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const megabytes = bytes / 1_048_576

  if (megabytes < 1) {
    return `${Math.round(bytes / 1024)} KB`
  }

  // Whole numbers are the common case (10 MB); only show a decimal when the
  // value genuinely has one.
  return Number.isInteger(megabytes)
    ? `${megabytes} MB`
    : `${megabytes.toFixed(1)} MB`
}

export function formatDocumentTypeDate(value?: string | null) {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function sortDocumentTypes(documentTypes: DocumentType[]) {
  // The backend returns rows in insertion order; active types first, then
  // alphabetical, keeps the table readable as the list grows.
  return [...documentTypes].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }

    return a.name.localeCompare(b.name)
  })
}
