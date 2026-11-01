import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { test } from "node:test"
import vm from "node:vm"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

const runtimeRequire = createRequire(import.meta.url)
const user = { id: "institution-user", role: "INSTITUTION" }

// Matches InstitutionResponseDto, including its array-valued staffingNeeds.
function institution(staffingNeeds) {
  return {
    id: "institution-profile",
    userId: user.id,
    name: "Greenfield School",
    domain: "greenfield.ac.uk",
    address: "1 School Lane",
    city: "London",
    countryCode: "GB",
    staffingNeeds,
    coverTypes: [],
    safeguardingConfirmed: false,
    verified: false,
    status: "INCOMPLETE",
    institutionType: "SINGLE_SCHOOL",
    trust: null,
  }
}

function harness(profiles, legacyEnvelope = false) {
  const calls = []
  const cache = new Map()
  function load(filename) {
    const full = path.resolve(filename)
    if (cache.has(full)) return cache.get(full).exports
    const loadedModule = { exports: {} }
    cache.set(full, loadedModule)
    const code = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText
    const localRequire = (name) => {
      if (name === "server-only") return {}
      if (name === "@/lib/auth/session") {
        return { getAdminAccessToken: async () => ({ ok: true, accessToken: "test-token" }) }
      }
      if (name === "@/lib/auth/config") {
        return {
          getAuthConfig: () => ({}),
          createAuthApiUrl: (_, route) => new URL(route, "https://backend.test/api/"),
        }
      }
      if (name === "@/components/users/instructor-status-control") {
        return { InstitutionStatusControl: () => null }
      }
      if (name.startsWith("@/")) {
        const base = name.slice(2)
        return load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`)
      }
      return runtimeRequire(name)
    }
    const fetch = async (url) => {
      calls.push(String(url))
      return new Response(JSON.stringify({
        success: true,
        data: legacyEnvelope ? profiles : {
          institutions: profiles,
          pagination: { page: 1, limit: 20, total: profiles.length, totalPages: 1 },
        },
      }))
    }
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
      fetch, Response, URL, AbortSignal, TextEncoder, console, process: { env: { NODE_ENV: "production" } },
    })(localRequire, loadedModule, loadedModule.exports)
    return loadedModule.exports
  }
  return { load, calls }
}

for (const legacyEnvelope of [false, true]) {
  test(`institution profile loads staffing subjects (${legacyEnvelope ? "array" : "paginated"} envelope)`, async () => {
    const h = harness([institution(["Mathematics", "Science"])], legacyEnvelope)
    const result = await h.load("lib/users/get-role-profile.ts").getRoleProfile(user)
    assert.equal(result.ok, true)
    assert.equal(result.kind, "institution")
    assert.equal(result.profile.id, "institution-profile")
    assert.deepEqual(Array.from(result.profile.staffingNeeds), ["Mathematics", "Science"])
    assert.deepEqual(h.calls, ["https://backend.test/api/institutions?userId=institution-user"])
    const { InstitutionProfileCard } = h.load("components/users/institution-profile-card.tsx")
    const html = renderToStaticMarkup(createElement(InstitutionProfileCard, { profile: result.profile }))
    assert.match(html, /Mathematics, Science/)
    assert.doesNotMatch(html, /No staffing needs have been provided/)
  })
}

test("empty staffing needs load and render the empty state", async () => {
  const h = harness([institution([])])
  const result = await h.load("lib/users/get-role-profile.ts").getRoleProfile(user)
  assert.equal(result.ok, true)
  const { InstitutionProfileCard } = h.load("components/users/institution-profile-card.tsx")
  const html = renderToStaticMarkup(createElement(InstitutionProfileCard, { profile: result.profile }))
  assert.match(html, /No staffing needs have been provided/)
})

test("malformed staffing subjects still reject the response", async () => {
  const h = harness([institution(["Mathematics", 42])])
  const result = await h.load("lib/users/get-role-profile.ts").getRoleProfile(user)
  assert.equal(result.ok, false)
  assert.equal(result.status, 502)
})

test("a response without the requested user's profile returns no match", async () => {
  const h = harness([{ ...institution([]), userId: "another-user" }])
  const result = await h.load("lib/users/get-role-profile.ts").getRoleProfile(user)
  assert.equal(result.ok, true)
  assert.equal(result.profile, null)
})
