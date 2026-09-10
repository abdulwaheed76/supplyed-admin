# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`).

```bash
pnpm dev      # dev server on :3001 (webpack, not turbopack)
pnpm build
pnpm start    # production server on :3001
pnpm lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit   # typecheck; there is no package script for it
```

Port 3001 is deliberate — the NestJS backend this app talks to runs on :3000.

There is **no test framework** in this project. Do not add test files or invent a
`pnpm test` command unless asked.

### Environment

Both are required (`.env`, gitignored; see `.env.example`):

- `API_BASE_URL` — server-only URL of the standalone NestJS API, e.g. `http://127.0.0.1:3000/api`
- `AUTH_SECRET` — Auth.js JWT encryption key (`openssl rand -base64 32`)

## Stack

Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 · shadcn/ui · Auth.js v5 (`next-auth@5.0.0-beta`) · Zod v4 · TanStack Query.

`@/*` resolves to the repo root. Tailwind v4 has no config file — theme tokens are
oklch CSS variables in [app/globals.css](app/globals.css).

## Architecture

This is a **thin admin console over a separate NestJS backend**. It owns no
database and no business logic. Every page is a Server Component that reads from
the backend; the backend envelope is `{ success, message, data }`.

### Auth is the load-bearing part — read this before touching it

The Auth.js session is a *carrier* for backend-issued access/refresh tokens, not
the source of truth for identity. The backend **rotates refresh tokens**, which
drives most of the design:

- **[proxy.ts](proxy.ts) is the only place a refresh may happen.** (Next 16 renamed
  `middleware` → `proxy`.) It is the only layer that can persist a rotated token
  to the cookie, because Server Components cannot write cookies. Its `matcher`
  must stay ahead of every authenticated route.
- **[auth.ts](auth.ts) `jwt` callback** owns refresh, guarded by a module-level
  `refreshCache` keyed on the *consumed* refresh token (60s TTL). The callback runs
  many times per browser request; without the cache each run would rotate
  separately and every rotation but one would be discarded, leaving the browser
  holding a retired token. `ACCESS_TOKEN_SKEW_MS` (120s) is the render budget, not
  clock skew — the current token must outlive the whole render.
- **[auth.ts](auth.ts) `authorized` callback** does route gating only, never network
  calls. It returns JSON 401 for `/api/*` (client `fetch` would choke on an HTML
  login redirect) and a `/login?next=…` redirect for pages.
- **[lib/auth/session.ts](lib/auth/session.ts) decodes the cookie directly via
  `getToken()` and deliberately does not call `auth()`** — `auth()` would run the
  `jwt` callback, and the proxy (edge) and Server Components (node) cannot share
  the dedupe cache. **On the render path, read the session through
  `getCurrentSession()` / `getAdminAccessToken()`, never `auth()`.**
- **The access token is kept off the `Session` object on purpose.** `auth()` output
  is what `/api/auth/session` serves to the browser, so anything placed there is
  readable by client JavaScript.
- **[lib/auth/cookies.ts](lib/auth/cookies.ts) pins the cookie name** because Auth.js
  derives the JWT encryption salt from it. `auth.ts` and `session.ts` must configure
  and decode with the same values.
- Sign-in failures cross the Auth.js boundary as short codes only, so
  [lib/auth/errors.ts](lib/auth/errors.ts) is the shared code→message table used by
  both the server (`authorize`) and the client (`login-form`).

### Single egress: `adminApiRequest`

[lib/api/admin-api-client.ts](lib/api/admin-api-client.ts) is the only path from this
app to the backend. Route new backend calls through it rather than calling `fetch`.
It resolves the session, sends `Authorization: Bearer`, and collapses transport,
HTTP, and schema failures into one result shape. Its `schema` validates the **full
response envelope**, not just `data`.

It never refreshes tokens — see above for why that would be unsafe. On a hard 401 it
fails closed and the next gated request redirects to `/login`.

### The result convention

Nothing on the data path throws. Everything returns a discriminated union:

```ts
{ ok: true, data: T } | { ok: false, message: string, status: number }
```

Pages branch on `result.ok` and render an error `Card` with `result.message` rather
than throwing to an error boundary. Follow this instead of introducing exceptions or
`error.tsx` boundaries.

### `lib/<domain>/` layout

Each domain (`users`, `jobs`, `documents`, `auth`) follows the same split:

- `get-*.ts` — server-only fetchers, first line `import "server-only"`
- `schema.ts` — Zod schemas and inferred types
- `presentation.ts` — pure formatters for display (`formatUserDate`, `getUserInitials`, …)

Backend response shapes are treated as untrusted and tolerant —
[lib/users/get-users.ts](lib/users/get-users.ts) accepts several pagination and list-key
variants (`users`/`items`/`data`, `meta`/`pagination`). Match that tolerance when
adding fetchers.

### Reads vs. writes

**Reads** happen in Server Components calling `lib/<domain>/get-*.ts` directly. Pages
take `searchParams: Promise<…>` (Next 16 async params) and paginate via `?page=`.

**Writes** go through a route handler in `app/api/`, called from a client component,
then `router.refresh()` to re-render the server tree. Every route handler follows the
same shape — copy it:

1. same-origin check on the `origin` header → 403
2. Zod-parse the body → 400 with the first issue message
3. `adminApiRequest(...)`
4. `revalidatePath(...)` for every affected route
5. respond with `Cache-Control: private, no-store`

`app/actions/` holds Server Actions, currently only sign-out.

**TanStack Query owns client mutations**, in three layers. Document types are the
reference implementation — copy that trio for a new endpoint:

1. **`lib/api/<domain>-api.ts`** — the request itself, e.g.
   [lib/api/document-type-api.ts](lib/api/document-type-api.ts). Takes a typed input,
   calls `routeRequest`, parses the response, returns a typed value or throws.
   Framework-free, so it is callable without React Query. It does **not** re-validate
   the input: the route handler parses with the same schema and answers a bad payload
   with a 400 whose message `routeRequest` raises, so a second parse would only
   duplicate that message and force the signature to `unknown`.
2. **`hooks/use-<domain>.ts`** — one file per module, not per action, holding
   every mutation hook for that domain: e.g.
   [hooks/use-document-types.ts](hooks/use-document-types.ts) exports
   `useCreateDocumentType`, `useUpdateDocumentType`, and `useDeleteDocumentType`.
   Only `useMutation` wiring: `mutationFn` is the API function, `onSuccess`
   navigates and calls `router.refresh()` — that is the invalidation, since reads
   are server-rendered. Add `queryClient.invalidateQueries` only if a read moves
   to a query.
3. **The component** — renders `mutation.isPending` / `mutation.error` and holds no
   submit state of its own.

Underneath, [lib/api/route-request.ts](lib/api/route-request.ts) `routeRequest()` is the
browser-side counterpart to `adminApiRequest`. It **throws** on failure rather than
returning a result union, because React Query drives `error` off a rejected promise.
Validation throws from the same place, so invalid input and a failed request both reach
the component as `mutation.error` and it renders one message.

Two older mutations still hand-roll this with `useTransition` and local error state —
[components/jobs/create-job-form.tsx](components/jobs/create-job-form.tsx) and
[components/users/instructor-status-control.tsx](components/users/instructor-status-control.tsx).
They are being migrated to the hook pattern above; follow the hook, not them.

**Reads stay in Server Components** — do not move page fetches into React Query.

## Conventions

- `components/ui/` is generated by the shadcn CLI (style `radix-nova`, base color
  neutral, lucide icons). Add components with the CLI rather than hand-writing them,
  and avoid editing them by hand.
- Authored files omit semicolons; the original create-next-app files
  (`app/layout.tsx`, config files) keep them. Match the file you are in.
- Comments in this codebase explain *why* a non-obvious constraint exists, especially
  around auth, caching, and token rotation. They encode real bugs — preserve them, and
  write them in the same register when adding a similarly subtle decision.
- Status pills use a consistent palette: emerald for active/verified, amber for
  pending, `destructive` for rejected/suspended, `muted` for inactive.
- Path params and user IDs are `encodeURIComponent`'d and length-capped (128) before
  reaching the backend URL.


## Backend Directory
- /Users/abdulwaheed/Documents/Idnmo/supply-ed/supplyed-backend