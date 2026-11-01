import "server-only"

import { z } from "zod"

import { getAdminAccessToken } from "@/lib/auth/session"
import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"

export type AdminApiFailure = { ok: false; message: string; status: number; code?: string; requestId?: string }
export type AdminApiResult<T> = { ok: true; data: T } | AdminApiFailure

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

/** The backend returns `message` as either a string or an array of strings. */
export function getApiErrorMessage(body: unknown, fallback: string) {
  const error = errorResponseSchema.safeParse(body)

  if (!error.success) {
    return fallback
  }

  return Array.isArray(error.data.message)
    ? error.data.message.join(" ")
    : error.data.message
}

function summarizeBody(body: unknown) {
  if (Array.isArray(body)) {
    return { type: "array", itemCount: body.length }
  }

  if (!body || typeof body !== "object") {
    return { type: typeof body }
  }

  const envelope = body as Record<string, unknown>

  return {
    type: "object",
    keys: Object.keys(envelope),
    success: envelope.success,
    itemCount: Array.isArray(envelope.data) ? envelope.data.length : undefined,
  }
}

type AdminApiRequestOptions<T> = {
  /** Path relative to `API_BASE_URL`, e.g. `documents/admin`. */
  path: string
  /** Parsed against the full response envelope, not just its `data` field. */
  schema: z.ZodType<T>
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  searchParams?: Record<string, string | number | undefined>
  body?: unknown
  /** Used when the backend gives no usable `message`. */
  fallbackMessage?: string
  /** Names the upstream in transport-failure messages, e.g. `documents`. */
  serviceName?: string
  /** Enables request/response logging outside production. */
  signal?: AbortSignal
  debugLabel?: string
}

/**
 * The single path from this app to the backend API. Every call resolves the
 * session the same way, sends the same headers, and collapses transport,
 * HTTP, and schema failures into one result shape.
 *
 * Token refresh is deliberately *not* handled here. The proxy owns it, because
 * it is the only layer that can persist a rotated token. Refreshing from this
 * layer would be unsafe: the backend rotates refresh tokens, and a Server
 * Component cannot write cookies, so a refresh triggered during render would
 * rotate the token and then discard the replacement, killing the session. On a
 * hard 401 this fails closed and the next gated request redirects to /login.
 */
export async function adminApiRequest<T>({
  path,
  schema,
  method = "GET",
  searchParams,
  body,
  fallbackMessage = "The request could not be completed.",
  serviceName = "backend",
  debugLabel,
  signal,
}: AdminApiRequestOptions<T>): Promise<AdminApiResult<T>> {
  const token = await getAdminAccessToken()

  if (!token.ok) {
    return token.reason === "misconfigured"
      ? {
          ok: false,
          message: "The authentication secret is not configured.",
          status: 503,
        }
      : {
          ok: false,
          message: "Your session has expired. Sign in again.",
          status: 401,
        }
  }

  const config = getAuthConfig()

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  const url = createAuthApiUrl(config, path)

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value))
    }
  }

  if (debugLabel && process.env.NODE_ENV !== "production") {
    console.info(`[${debugLabel}] Request`, {
      method,
      url: url.toString(),
      authorization: "Bearer [REDACTED]",
    })
  }

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(process.env.BFF_SHARED_SECRET ? { "X-SupplyEd-BFF": process.env.BFF_SHARED_SECRET } : {}),
        Authorization: `Bearer ${token.accessToken}`,
        ...(body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
    })
  } catch (error) {
    if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name))
      return { ok: false, message: "The request took too long. Please try again.", status: 504 };
    return {
      ok: false,
      message: `The ${serviceName} service is unavailable.`,
      status: 503,
    }
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (debugLabel && process.env.NODE_ENV !== "production") {
    console.info(`[${debugLabel}] Response`, {
      status: response.status,
      ok: response.ok,
      body: summarizeBody(responseBody),
    })
  }

  if (!response.ok) {
    const details = z.object({ code: z.string().optional(), meta: z.object({ requestId: z.string().optional() }).optional() }).safeParse(responseBody)
    return {
      ok: false,
      message: getApiErrorMessage(responseBody, fallbackMessage),
      status: response.status,
      code: details.success ? details.data.code : undefined,
      requestId: details.success ? details.data.meta?.requestId : undefined,
    }
  }

  const result = schema.safeParse(responseBody)

  if (!result.success) {
    return {
      ok: false,
      message: `The ${serviceName} service returned an invalid response.`,
      status: 502,
    }
  }

  return { ok: true, data: result.data }
}
