import "server-only"

import { cookies } from "next/headers"
import { z } from "zod"

import { createAuthApiUrl, getAuthConfig } from "@/lib/auth/config"
import { ACCESS_TOKEN_COOKIE_NAME } from "@/lib/auth/session-cookie"
import { userSchema, type UserListItem } from "@/lib/users/schema"

const paginationSchema = z
  .object({
    page: z.number().int().positive().optional(),
    currentPage: z.number().int().positive().optional(),
    limit: z.number().int().positive().optional(),
    pageSize: z.number().int().positive().optional(),
    itemsPerPage: z.number().int().positive().optional(),
    total: z.number().int().nonnegative().optional(),
    totalItems: z.number().int().nonnegative().optional(),
    totalCount: z.number().int().nonnegative().optional(),
    totalPages: z.number().int().nonnegative().optional(),
    hasNext: z.boolean().optional(),
    hasNextPage: z.boolean().optional(),
  })
  .passthrough()

const paginatedUsersSchema = paginationSchema
  .extend({
    users: z.array(userSchema).optional(),
    items: z.array(userSchema).optional(),
    data: z.array(userSchema).optional(),
    pagination: paginationSchema.optional(),
    meta: paginationSchema.optional(),
  })
  .refine(
    (value) =>
      value.users !== undefined ||
      value.items !== undefined ||
      value.data !== undefined
  )

const usersResponseSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: z.unknown().optional(),
})

const errorResponseSchema = z.object({
  message: z.union([z.string(), z.array(z.string())]),
})

type GetUsersResult =
  | {
      ok: true
      users: UserListItem[]
      pagination: {
        page: number
        limit: number
        total?: number
        totalPages?: number
        hasNextPage: boolean
      }
    }
  | { ok: false; message: string; status: number }

type GetUsersOptions = {
  page: number
  limit: number
}

function summarizeResponseBody(body: unknown) {
  if (Array.isArray(body)) {
    return { type: "array", itemCount: body.length }
  }

  if (!body || typeof body !== "object") {
    return { type: typeof body }
  }

  const envelope = body as Record<string, unknown>
  const data = envelope.data
  const dataSummary = Array.isArray(data)
    ? { type: "array", itemCount: data.length }
    : data && typeof data === "object"
      ? {
          type: "object",
          keys: Object.keys(data),
          arrayCounts: Object.fromEntries(
            Object.entries(data)
              .filter(([, value]) => Array.isArray(value))
              .map(([key, value]) => [key, (value as unknown[]).length])
          ),
        }
      : { type: typeof data }

  return {
    type: "object",
    keys: Object.keys(envelope),
    success: envelope.success,
    statusCode: envelope.statusCode,
    message: envelope.message,
    data: dataSummary,
  }
}

function logUsersRequest(url: URL, page: number, limit: number) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  console.info("[users-api] Request", {
    method: "GET",
    url: url.toString(),
    headers: {
      Accept: "application/json",
      Authorization: "Bearer [REDACTED]",
    },
    pagination: { page, limit },
  })
}

function logUsersResponse(response: Response, body: unknown) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  console.info("[users-api] Response", {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    body: summarizeResponseBody(body),
  })
}

function readPagination(
  value: unknown,
  fallback: GetUsersOptions,
  itemCount: number
) {
  const nested = z
    .object({ pagination: paginationSchema })
    .passthrough()
    .safeParse(value)
  const parsed = paginationSchema.safeParse(
    nested.success ? nested.data.pagination : value
  )
  const data = parsed.success ? parsed.data : {}
  const page = data.page ?? data.currentPage ?? fallback.page
  const limit =
    data.limit ?? data.pageSize ?? data.itemsPerPage ?? fallback.limit
  const total = data.total ?? data.totalItems ?? data.totalCount
  const totalPages =
    data.totalPages ??
    (total === undefined ? undefined : Math.ceil(total / Math.max(limit, 1)))
  const hasNextPage =
    data.hasNextPage ??
    data.hasNext ??
    (totalPages === undefined ? itemCount === limit : page < totalPages)

  return { page, limit, total, totalPages, hasNextPage }
}

export async function getUsers({
  page,
  limit,
}: GetUsersOptions): Promise<GetUsersResult> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value
  const config = getAuthConfig()

  if (!accessToken) {
    return {
      ok: false,
      message: "Your session has expired. Sign in again.",
      status: 401,
    }
  }

  if (!config) {
    return {
      ok: false,
      message: "The backend API URL is not configured.",
      status: 503,
    }
  }

  const url = createAuthApiUrl(config, "users")
  url.searchParams.set("page", String(page))
  url.searchParams.set("limit", String(limit))
  logUsersRequest(url, page, limit)

  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })
  } catch {
    return {
      ok: false,
      message: "The users service is unavailable.",
      status: 503,
    }
  }

  const body: unknown = await response.json().catch(() => null)
  logUsersResponse(response, body)

  if (!response.ok) {
    const error = errorResponseSchema.safeParse(body)
    const message = error.success
      ? Array.isArray(error.data.message)
        ? error.data.message.join(" ")
        : error.data.message
      : "Unable to load users."

    return { ok: false, message, status: response.status }
  }

  const envelope = usersResponseSchema.safeParse(body)

  if (!envelope.success) {
    return {
      ok: false,
      message: "The users service returned an invalid response.",
      status: 502,
    }
  }

  const list = z.array(userSchema).safeParse(envelope.data.data)

  if (list.success) {
    return {
      ok: true,
      users: list.data,
      pagination: readPagination(
        envelope.data.meta,
        { page, limit },
        list.data.length
      ),
    }
  }

  const paginated = paginatedUsersSchema.safeParse(envelope.data.data)

  if (!paginated.success) {
    return {
      ok: false,
      message: "The users service returned an invalid response.",
      status: 502,
    }
  }

  const users =
    paginated.data.users ?? paginated.data.items ?? paginated.data.data ?? []

  return {
    ok: true,
    users,
    pagination: readPagination(
      paginated.data.pagination ?? paginated.data.meta ?? paginated.data,
      { page, limit },
      users.length
    ),
  }
}
