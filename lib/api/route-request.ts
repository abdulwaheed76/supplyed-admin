import type { z } from "zod"

/**
 * The browser-side counterpart to `adminApiRequest`: it calls this app's own
 * `/api/*` route handlers, which have already resolved the session and talked
 * to the backend.
 *
 * Unlike the server path, this *throws* on failure instead of returning a
 * result union. React Query drives `isPending` / `error` off a rejected
 * promise, so a thrown error is what a `useMutation` needs — the result union
 * would have to be unwrapped and re-thrown at every call site.
 *
 * Route handlers report failures as `{ message }`, so that is what gets
 * surfaced; the message is written for an admin to read.
 */
type RouteRequestOptions<T> = {
  method?: "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  /** Parses the success response. Omit when the caller ignores the body. */
  schema?: z.ZodType<T>
  fallbackMessage?: string
}

function readErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message.trim()
  ) {
    return body.message
  }

  return fallback
}

export async function routeRequest<T = unknown>(
  path: string,
  {
    method = "POST",
    body,
    schema,
    fallbackMessage = "The request could not be completed.",
  }: RouteRequestOptions<T> = {}
): Promise<T> {
  // Every caller targets this app's own route handlers, so the path is always
  // site-absolute. A relative path silently resolves against the *current page*
  // -- `api/document-types` posted from /dashboard/document-types/new became
  // /dashboard/document-types/api/document-types and 404'd -- so normalise here
  // rather than leaving each call site to remember the slash.
  const url = path.startsWith("/") ? path : `/${path}`

  let response: Response

  try {
    response = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new Error(
      "The server could not be reached. Check your connection and try again."
    )
  }

  const responseBody: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(readErrorMessage(responseBody, fallbackMessage))
  }

  if (!schema) {
    return responseBody as T
  }

  const parsed = schema.safeParse(responseBody)

  if (!parsed.success) {
    throw new Error(
      "The request succeeded, but the response could not be read."
    )
  }

  return parsed.data
}
