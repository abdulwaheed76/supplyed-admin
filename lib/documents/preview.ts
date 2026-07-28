const PREVIEWABLE_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
])

export function normalizeDocumentContentType(contentType: string) {
  return contentType.split(";", 1)[0].trim().toLowerCase()
}

export function isPreviewableDocumentContentType(contentType: string) {
  return PREVIEWABLE_CONTENT_TYPES.has(
    normalizeDocumentContentType(contentType)
  )
}
