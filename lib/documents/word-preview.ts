import "server-only"


export const PREVIEW_HTML_CSP =
  "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'"
export const MAX_WORD_PREVIEW_BYTES = 20 * 1024 * 1024

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  )
}

function previewPage(content: string, title: string) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f5f6f8;color:#17202c;font:15px/1.7 Arial,sans-serif}main{max-width:860px;min-height:100vh;margin:0 auto;padding:36px;background:#fff;overflow-wrap:anywhere}h1,h2,h3,h4{line-height:1.3}p{margin:0 0 1em}img{display:block;max-width:100%;height:auto}table{width:100%;border-collapse:collapse;margin:1em 0;table-layout:fixed}td,th{border:1px solid #dfe3e8;padding:8px;vertical-align:top}pre{white-space:pre-wrap}.notice{margin-bottom:24px;border-bottom:1px solid #e5e7eb;padding-bottom:12px;font-size:12px;color:#687384}@media(max-width:540px){main{padding:20px}}
  </style></head><body><main>${content}</main></body></html>`
}

export function renderPreviewError(message: string) {
  return previewPage(
    `<h2>Preview unavailable</h2><p>${escapeHtml(message)}</p><p>Use Download to open the original file.</p>`,
    "Document preview",
  )
}

export async function readPreviewBuffer(response: Response) {
  if (Number(response.headers.get("content-length")) > MAX_WORD_PREVIEW_BYTES) {
    await response.body?.cancel()
    throw new Error("This document is too large for an inline preview.")
  }
  const reader = response.body?.getReader()
  if (!reader) throw new Error("The document is empty.")
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_WORD_PREVIEW_BYTES) {
        await reader.cancel()
        throw new Error("This document is too large for an inline preview.")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  return Buffer.concat(chunks, size)
}
