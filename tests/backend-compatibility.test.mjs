import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { createRequire } from "node:module"
import { test } from "node:test"
import ts from "typescript"

const runtimeRequire = createRequire(import.meta.url)
const { NextRequest } = runtimeRequire("next/server")
const id = "11111111-1111-4111-8111-111111111111"

// Run the actual admin route, schema and transport; replace only auth and I/O.
function harness(upstreamData = {}) {
  const calls = []
  const cache = new Map()
  function load(filename) {
    const full = path.resolve(filename)
    if (cache.has(full)) return cache.get(full).exports
    const mod = { exports: {} }
    cache.set(full, mod)
    const code = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText
    const localRequire = name => {
      if (name === "server-only") return {}
      if (name === "next/cache") return { revalidatePath() {} }
      if (name === "@/lib/auth/session") return { getAdminAccessToken: async () => ({ ok: true, accessToken: "test-token" }) }
      if (name === "@/lib/auth/config") return {
        getAuthConfig: () => ({}),
        createAuthApiUrl: (_, route) => new URL(route, "https://backend.test/api/"),
      }
      if (name.startsWith("@/")) return load(name.slice(2) + ".ts")
      return runtimeRequire(name)
    }
    const fetch = async (url, init) => {
      calls.push({ url: String(url), ...init })
      return new Response(JSON.stringify({ success: true, data: upstreamData }))
    }
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
      fetch, Response, URL, AbortSignal, TextEncoder, console, process: { env: { NODE_ENV: "production" } },
    })(localRequire, mod, mod.exports)
    return mod.exports
  }
  function invoke(file, method, body) {
    return load(file)[method](new NextRequest("https://admin.test/api/test", {
      method, headers: { origin: "https://admin.test", "Content-Type": "application/json" }, body: JSON.stringify(body),
    }), { params: Promise.resolve({ id }) })
  }
  return { calls, load, invoke }
}

const credentials = { email: "teacher@example.test", password: "SamplePassword123!" }

test("user creation forwards the chosen instructor or institution role", async () => {
  for (const role of ["INSTRUCTOR", "INSTITUTION"]) {
    const h = harness({ id, email: credentials.email, role, emailVerified: false })
    const response = await h.invoke("app/api/users/route.ts", "POST", { ...credentials, role })
    assert.equal(response.status, 201)
    assert.equal(h.calls[0].url, "https://backend.test/api/users/admin")
    assert.deepEqual(JSON.parse(h.calls[0].body), { ...credentials, role })
  }
})

test("missing and unsupported creation roles never reach the backend", async () => {
  const h = harness()
  for (const role of [undefined, "USER", "RECRUITER", "ADMIN"]) {
    assert.equal((await h.invoke("app/api/users/route.ts", "POST", { ...credentials, role })).status, 400)
  }
  assert.equal(h.calls.length, 0)
})

test("role editing accepts backend roles and rejects retired roles before sending", async () => {
  for (const role of ["ADMIN", "INSTRUCTOR", "INSTITUTION", "USER", "RECRUITER"]) {
    const h = harness({ id, email: credentials.email, role, emailVerified: true })
    const response = await h.invoke("app/api/users/[id]/route.ts", "PATCH", { role })
    const supported = ["ADMIN", "INSTRUCTOR", "INSTITUTION"].includes(role)
    assert.equal(response.status, supported ? 200 : 400)
    assert.equal(h.calls.length, supported ? 1 : 0)
    if (supported) assert.deepEqual(JSON.parse(h.calls[0].body), { role })
  }
})

test("obsolete role filters and recruiter profiles do not call unsupported backend APIs", async () => {
  const h = harness()
  for (const role of ["USER", "RECRUITER"]) {
    const result = await h.load("lib/users/get-users.ts").getUsers({ page: 1, limit: 20, role })
    assert.equal(result.status, 400)
    const profile = await h.load("lib/users/get-role-profile.ts").getRoleProfile({ id, role })
    assert.equal(profile.kind, "none")
  }
  assert.equal(h.calls.length, 0)
})

test("job creation preserves structured address fields and renders the returned location", async () => {
  const input = {
    title: "Maths cover", description: "Cover a maths class", keyStages: [],
    address: "1 School Lane", city: "London", county: "Greater London", postalCode: "SW1A 2AA",
  }
  const h = harness({ ...input, id, postedByUserId: id, status: "DRAFT" })
  const response = await h.invoke("app/api/jobs/route.ts", "POST", input)
  assert.equal(response.status, 201)
  assert.equal(h.calls[0].url, "https://backend.test/api/jobs")
  assert.deepEqual(JSON.parse(h.calls[0].body), input)
  const { job } = await response.json()
  const { getJobLocation } = h.load("lib/jobs/presentation.ts")
  assert.equal(getJobLocation(job), "1 School Lane, London, Greater London, SW1A 2AA")
  assert.equal(getJobLocation({ city: "London", address: null }), "London")
  assert.equal(getJobLocation({}), "")
})

test("legacy location and excessive address lengths are rejected without losing entered data upstream", async () => {
  const h = harness()
  for (const extra of [{ location: "London" }, { address: "a".repeat(251) }, { city: "a".repeat(101) }, { county: "a".repeat(101) }, { postalCode: "a".repeat(21) }, { subject: "a".repeat(101) }]) {
    const response = await h.invoke("app/api/jobs/route.ts", "POST", {
      title: "Cover", description: "Cover a class", keyStages: [], ...extra,
    })
    assert.equal(response.status, 400)
  }
  assert.equal(h.calls.length, 0)
})

test("document review history accepts the backend file key and hides obsolete rejection notes", async () => {
  const document = { id, fileKey: "current.pdf", status: "REJECTED" }
  const review = { id: "review", documentId: id, reviewedFileKey: "current.pdf", reviewerId: id,
    fromStatus: "PENDING", toStatus: "REJECTED", notes: "Replace the expired document", createdAt: "2026-10-29T10:00:00Z" }
  const h = harness([review])
  const { getDocumentReviews, getLatestDocumentReviewComment } = h.load("lib/document-reviews/get-document-reviews.ts")
  const result = await getDocumentReviews(id)
  assert.equal(result.ok, true)
  assert.equal(getLatestDocumentReviewComment(result.reviews, document).notes, review.notes)
  assert.equal(getLatestDocumentReviewComment(result.reviews, { ...document, fileKey: "replacement.pdf" }), null)
  assert.equal(getLatestDocumentReviewComment(result.reviews, { ...document, status: "APPROVED" }), null)
  assert.equal(getLatestDocumentReviewComment(result.reviews, { ...document, status: "PENDING" }), null)
})

function conversation(job = { id, title: "Cover" }) {
  return { id, applicationId: null, applicationStatus: null, booking: null, readOnly: true, job,
    participants: {
      instructor: { id, userId: id, name: "Teacher", role: "teacher" },
      poster: { id: null, userId: id, name: "School", role: "school" },
    }, instructorLastReadAt: null, posterLastReadAt: null, lastMessage: null, lastMessageAt: null,
    createdAt: "2026-10-29T10:00:00Z" }
}

test("job conversations without applications load and have a readable label", async () => {
  const data = { job: { id, title: "Cover" }, conversations: [conversation()],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false } }
  const h = harness(data)
  const result = await h.load("lib/conversations/get-conversations.ts").getJobConversations(id)
  assert.equal(result.ok, true)
  const { getConversationStatusLabel } = h.load("lib/conversations/presentation.ts")
  assert.equal(getConversationStatusLabel(result.data.conversations[0]), "Job conversation")
  assert.equal(getConversationStatusLabel(conversation(null)), "General conversation")
  assert.equal(getConversationStatusLabel({ ...conversation(), booking: { id, applicationId: id, status: "CONFIRMED" } }), "Confirmed")
})

test("a general conversation cannot be displayed under an unrelated job", async () => {
  const h = harness(conversation(null))
  const result = await h.load("lib/conversations/get-conversations.ts").getConversation(id, id)
  assert.equal(result.ok, false)
  assert.equal(result.status, 404)
})

test("job options use active backend values, preserving labels separately", () => {
  const { activeJobOptions } = harness().load("lib/jobs/form-options.ts")
  const group = { isActive: true, options: [
    { value: "KS3", label: "Key Stage 3", isActive: true },
    { value: "KS4", label: "Retired stage", isActive: false },
  ] }
  assert.deepEqual(JSON.parse(JSON.stringify(activeJobOptions(group))), [{ value: "KS3", label: "Key Stage 3" }])
  assert.equal(activeJobOptions({ ...group, isActive: false }).length, 0)
})

test("job dates are sent as ISO timestamps and expiry cannot extend into work", async () => {
  const input = { title: "Cover", description: "Teaching cover", keyStages: [], startDate: "2027-01-02", expiresAt: "2027-01-01" }
  const h = harness({ ...input, id, postedByUserId: id, status: "DRAFT" })
  assert.equal((await h.invoke("app/api/jobs/route.ts", "POST", input)).status, 201)
  assert.equal(JSON.parse(h.calls[0].body).startDate, "2027-01-02T00:00:00.000Z")
  assert.equal((await h.invoke("app/api/jobs/route.ts", "POST", { ...input, expiresAt: "2027-01-03" })).status, 400)
  assert.equal(h.calls.length, 1)
})

test("Other subject sends the supported fields and requires a custom name", async () => {
  const input = { title: "Cover", description: "Teaching cover", keyStages: [], subjects: ["Other"], otherSubjects: ["Robotics"] }
  const h = harness({ ...input, id, postedByUserId: id, status: "DRAFT" })
  assert.equal((await h.invoke("app/api/jobs/route.ts", "POST", input)).status, 201)
  assert.deepEqual(JSON.parse(h.calls[0].body), input)
  assert.equal((await h.invoke("app/api/jobs/route.ts", "POST", { ...input, otherSubjects: [] })).status, 400)
  assert.equal(h.calls.length, 1)
})

test("existing legacy users can have their details edited without sending an unsupported role", async () => {
  const h = harness({ id, email: credentials.email, role: "USER", emailVerified: false, name: "Updated" })
  const response = await h.invoke("app/api/users/[id]/route.ts", "PATCH", { name: "Updated" })
  assert.equal(response.status, 200)
  assert.deepEqual(JSON.parse(h.calls[0].body), { name: "Updated" })
})
