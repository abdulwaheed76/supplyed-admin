/* eslint-disable @typescript-eslint/no-require-imports -- This CommonJS runner loads TypeScript fixtures without a separate test framework. */
const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const Module = require("node:module")
const ts = require("typescript")
const root = path.resolve(__dirname, "..")
const resolve = Module._resolveFilename
Module._resolveFilename = function (request, ...args) {
  return resolve.call(
    this,
    request.startsWith("@/") ? path.join(root, request.slice(2)) : request,
    ...args,
  )
}
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  })
  module._compile(result.outputText, filename)
}
let metadata = {
  ok: true,
  downloadUrl: new URL("https://storage.example.test/document"),
  expiresAt: "2099-01-01",
  originalName: "sample.docx",
}
const load = Module._load
Module._load = function (request, ...args) {
  if (request === "server-only") return {}
  if (request === "@/lib/documents/get-document-download-url")
    return { getDocumentDownloadUrl: async () => metadata }
  return load.call(this, request, ...args)
}
const { GET } = require("../app/api/documents/[id]/content/route.ts")
const {
  isPreviewableDocumentContentType,
} = require("../lib/documents/preview.ts")
const {
  renderDocxPreview,
  renderLegacyWordPreview,
  readPreviewBuffer,
  MAX_WORD_PREVIEW_BYTES,
} = require("../lib/documents/word-preview.ts")
const docx = fs.readFileSync(path.join(__dirname, "fixtures/sample.docx"))
const doc = fs.readFileSync(path.join(__dirname, "fixtures/sample.doc"))
const docxMime =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
const request = (query = "", headers) =>
  GET(
    new Request(`http://localhost/api/documents/document/content${query}`, {
      headers,
    }),
    { params: Promise.resolve({ id: "document" }) },
  )
const originalFetch = global.fetch
async function main() {
  for (const mime of [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    docxMime,
  ])
    assert.equal(isPreviewableDocumentContentType(mime), true)
  assert.equal(isPreviewableDocumentContentType("text/html"), false)
  const html = await renderDocxPreview(docx)
  assert.match(html, /SupplyED document preview/)
  assert.match(html, /<table>/)
  assert.match(html, /Untrusted link/)
  assert.doesNotMatch(html, /javascript:|<script|onclick=/i)
  assert.match(
    await renderLegacyWordPreview(doc),
    /This is a test of reviewing/,
  )
  await assert.rejects(renderDocxPreview(Buffer.from("broken")))
  await assert.rejects(
    readPreviewBuffer(
      new Response("large", {
        headers: { "content-length": String(MAX_WORD_PREVIEW_BYTES + 1) },
      }),
    ),
  )

  for (const [mime, buffer] of [
    [docxMime, docx],
    ["application/msword", doc],
  ]) {
    global.fetch = async () =>
      new Response(buffer, { headers: { "content-type": mime } })
    const response = await request()
    assert.equal(response.status, 200)
    assert.match(response.headers.get("content-type"), /text\/html/)
    assert.match(response.headers.get("content-security-policy"), /sandbox/)
    assert.equal(response.headers.get("cache-control"), "private, no-store")
    assert.match(await response.text(), /Word .*preview/)
    const download = await request("?download=1")
    assert.match(download.headers.get("content-disposition"), /^attachment/)
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), buffer)
  }
  for (const mime of [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ]) {
    const bytes = Buffer.from("original file bytes")
    global.fetch = async () =>
      new Response(bytes, { headers: { "content-type": mime } })
    const response = await request()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get("content-type"), mime)
    assert.equal(response.headers.get("content-disposition"), "inline")
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes)
  }
  metadata.contentType = "application/pdf"
  global.fetch = async () =>
    new Response("%PDF-1.7", {
      headers: { "content-type": "application/octet-stream" },
    })
  assert.equal((await request()).headers.get("content-type"), "application/pdf")
  global.fetch = async (_url, options) => {
    assert.equal(options.headers.Range, "bytes=0-3")
    return new Response("%PDF", {
      status: 206,
      headers: {
        "content-type": "application/pdf",
        "content-range": "bytes 0-3/100",
        "accept-ranges": "bytes",
      },
    })
  }
  const partial = await request("", { range: "bytes=0-3" })
  assert.equal(partial.status, 206)
  assert.equal(partial.headers.get("content-range"), "bytes 0-3/100")
  assert.equal(await partial.text(), "%PDF")
  global.fetch = async () => {
    throw new Error("Must not fetch")
  }
  assert.equal((await request("", { range: "invalid" })).status, 416)
  metadata = { ok: false, status: 403, message: "Forbidden" }
  assert.equal((await request()).status, 403)
  assert.equal((await request("?download=1")).status, 403)
  metadata = {
    ok: true,
    downloadUrl: new URL("https://storage.example.test/document"),
    expiresAt: "2099-01-01",
  }
  global.fetch = async () =>
    new Response("damaged", { headers: { "content-type": docxMime } })
  const damaged = await request()
  assert.equal(damaged.status, 422)
  assert.match(await damaged.text(), /Download/)
  console.log(
    "Document preview checks passed: all six formats, real DOC/DOCX conversion, sanitization, PDF ranges, binary MIME fallback, downloads, denied access and damaged files.",
  )
}
main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.fetch = originalFetch
  })
