const PREVIEWABLE_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
])

export function normalizeDocumentContentType(contentType: string) {
  return contentType.split(";", 1)[0].trim().toLowerCase()
}

export function isPreviewableDocumentContentType(contentType: string) {
  return PREVIEWABLE_CONTENT_TYPES.has(
    normalizeDocumentContentType(contentType),
  )
}

export function isDocxDocumentContentType(contentType: string) {
  return (
    normalizeDocumentContentType(contentType) ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
}

export function isWordDocumentContentType(contentType: string) {
  return (
    isDocxDocumentContentType(contentType) ||
    normalizeDocumentContentType(contentType) === "application/msword"
  )
}
