import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { createRequire } from 'node:module'
const runtimeRequire = createRequire(import.meta.url)
const { NextRequest } = runtimeRequire('next/server')

// Exercise the real route, readers, validators and API transport with only
// authentication, cache invalidation and the upstream network substituted.
function harness({ authenticated = true, upstreamStatus = 200, upstreamBody } = {}) {
 const calls = [], invalidated = [], cache = new Map()
 const option = { key: 'algebra', value: 'Algebra', label: 'Algebra', aliases: [], group: null, sortOrder: 0, isActive: true, isShared: false, subjectKeys: ['mathematics'] }
 const detail = { id: 'skills', name: 'skill', label: 'Skills', revision: 8, isActive: true, updatedAt: '2026-10-19T12:00:00Z', expandable: true, options: [option] }
 const envelope = { success: true, statusCode: 200, message: 'Saved', data: detail, meta: { requestId: 'req-1', timestamp: '2026-10-19', path: '/api/dropdowns/skill', method: 'PATCH' } }
 const fetch = async (url, init) => { calls.push({ url: String(url), ...init }); return new Response(JSON.stringify(upstreamBody ?? envelope), { status: upstreamStatus }) }
 function load(filename) {
  const full = path.resolve(filename)
  if (cache.has(full)) return cache.get(full).exports
  const loadedModule = { exports: {} }; cache.set(full, loadedModule)
  const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const localRequire = name => {
   if (name === 'server-only') return {}
   if (name === 'next/cache') return { revalidatePath: p => invalidated.push(p) }
   if (name === '@/lib/auth/session') return { getAdminAccessToken: async () => authenticated ? { ok: true, accessToken: 'test-server-token' } : { ok: false, reason: 'unauthenticated' } }
   if (name === '@/lib/auth/config') return { getAuthConfig: () => ({}), createAuthApiUrl: (_, p) => new URL(p, 'https://backend.test/api/') }
   if (name.startsWith('@/')) return load(name.slice(2) + '.ts')
   if (name.startsWith('.')) return load(path.resolve(path.dirname(full), name) + '.ts')
   return runtimeRequire(name)
  }
  vm.runInNewContext(`(function(require,module,exports){${code}\n})`, { fetch, Response, URL, AbortSignal, TextEncoder, console, process })(localRequire, loadedModule, loadedModule.exports)
  return loadedModule.exports
 }
 const route = load('app/api/dropdowns/[name]/route.ts')
 const invoke = (method, body, origin = 'https://admin.test') => route[method](new NextRequest('https://admin.test/api/dropdowns/skill', { method, headers: { origin, 'Content-Type': 'application/json' }, ...(method === 'GET' ? {} : { body: JSON.stringify(body) }) }), { params: Promise.resolve({ name: 'skill' }) })
 return { invoke, calls, invalidated, detail, load }
}
test('PATCH forwards only the edited option and the exact revision; credentials stay upstream', async () => {
 const h = harness(); const body = { revision: 7, options: [{ key: 'algebra', value: 'Algebra', label: 'Algebra II', subjectKeys: ['mathematics', 'physics'] }] }
 const response = await h.invoke('PATCH', body)
 assert.equal(response.status, 200); assert.deepEqual(JSON.parse(h.calls[0].body), body)
 assert.equal(h.calls[0].url, 'https://backend.test/api/dropdowns/skill')
 assert.equal(h.calls[0].headers.Authorization, 'Bearer test-server-token')
 assert.equal(h.calls[0].cache, 'no-store'); assert.equal(response.headers.get('cache-control'), 'private, no-store')
 assert.deepEqual(await response.json(), { dropdown: h.detail })
 assert.deepEqual(h.invalidated, ['/dashboard/dropdowns', '/dashboard/dropdowns/skill'])
})
test('signed-out PATCH and admin GET fail closed without upstream calls', async () => {
 const h = harness({ authenticated: false })
 assert.equal((await h.invoke('PATCH', { revision: 7, label: 'Skills' })).status, 401)
 assert.equal((await h.invoke('GET')).status, 401); assert.equal(h.calls.length, 0)
})
test('cross-origin mutations are rejected', async () => {
 const h = harness(); assert.equal((await h.invoke('DELETE', { revision: 7 }, 'https://attacker.test')).status, 403); assert.equal(h.calls.length, 0)
})
test('empty or misspelled option scope never retires a whole collection', async () => {
 const h = harness()
 for (const body of [{ revision: 7, optionKeys: [] }, { revision: 7, optionsKeys: ['algebra'] }, { optionKeys: ['algebra'] }]) assert.equal((await h.invoke('DELETE', body)).status, 400)
 assert.equal(h.calls.length, 0)
})
test('option and collection retirement preserve distinct request bodies', async () => {
 const h = harness()
 for (const body of [{ revision: 7, optionKeys: ['algebra'] }, { revision: 8 }]) {
  assert.equal((await h.invoke('DELETE', body)).status, 200); assert.deepEqual(JSON.parse(h.calls.at(-1).body), body)
 }
})
test('conflicts preserve status, code and support reference; fresh reads use admin endpoint', async () => {
 const h = harness({ upstreamStatus: 409, upstreamBody: { message: 'Changed', code: 'DROPDOWN_REVISION_CONFLICT', meta: { requestId: 'conflict-1' } } })
 const response = await h.invoke('PATCH', { revision: 7, label: 'Skills' })
 assert.equal(response.status, 409); assert.deepEqual(await response.json(), { message: 'Changed', code: 'DROPDOWN_REVISION_CONFLICT', requestId: 'conflict-1' }); assert.equal(h.invalidated.length, 0)
 const fresh = harness(); await fresh.invoke('GET'); assert.equal(fresh.calls[0].url, 'https://backend.test/api/dropdowns/admin/skill')
})
test('browser transport throws a typed conflict rather than losing status', async () => {
 const h = harness({ upstreamStatus: 409, upstreamBody: { message: 'Changed', code: 'DROPDOWN_REVISION_CONFLICT', requestId: 'conflict-1' } })
 const { routeRequest, RouteRequestError } = h.load('lib/api/route-request.ts')
 await assert.rejects(routeRequest('/api/dropdowns/skill', { method: 'PATCH', body: { revision: 7, label: 'Skills' } }), error => error instanceof RouteRequestError && error.status === 409 && error.code === 'DROPDOWN_REVISION_CONFLICT' && error.requestId === 'conflict-1')
})
test('malformed upstream success is rejected and does not revalidate pages', async () => {
 const h = harness({ upstreamBody: { success: true, data: { name: 'skill' } } })
 assert.equal((await h.invoke('PATCH', { revision: 7, label: 'Skills' })).status, 502); assert.equal(h.invalidated.length, 0)
})
