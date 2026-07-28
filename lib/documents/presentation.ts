import type {
  DocumentContentType,
  DocumentType,
} from "@/lib/documents/types"

const documentTypeLabels: Record<DocumentType, string> = {
  DBS: "DBS check",
  ID: "Identity document",
  ADDRESS_PROOF: "Proof of address",
  QUALIFICATION: "Qualification",
  INSTITUTION_REGISTRATION: "Institution registration",
}

const documentContentTypeLabels: Record<DocumentContentType, string> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
}

export function getDocumentTypeLabel(type: DocumentType) {
  return documentTypeLabels[type]
}

export function getDocumentContentTypeLabel(contentType: DocumentContentType) {
  return documentContentTypeLabels[contentType]
}
