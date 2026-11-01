import "server-only"

import { z } from "zod"

import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getRoleProfile, withRoleProfileName } from "@/lib/users/get-role-profile"
import { getUserProvidedName } from "@/lib/users/presentation"
import { userSchema, type UserListItem } from "@/lib/users/schema"
import { userRoleSchema } from "@/lib/users/roles"

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

export type GetUsersOptions = {
  page: number
  limit: number
  search?: string
  role?: string
  accountType?: string
  countries?: string
  profileStatus?: string
  emailVerified?: string
  phoneVerified?: string
  createdFrom?: string
  createdTo?: string
  joined?: string
  sortBy?: string
  sortOrder?: string
}

export type UserFilters = Omit<GetUsersOptions, "page" | "limit">

async function resolveUserNames(users: UserListItem[]) {
  // The users API omits profile names; look them up only when the account has no name.
  const resolved: UserListItem[] = []
  for (let offset = 0; offset < users.length; offset += 4) {
    const batch = await Promise.all(users.slice(offset, offset + 4).map(async (user) => {
      if (getUserProvidedName(user)) return user
      return withRoleProfileName(user, await getRoleProfile(user))
    }))
    resolved.push(...batch)
  }
  return resolved
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

export async function getUsers(options: GetUsersOptions): Promise<GetUsersResult> {
  if (options.role !== undefined && !userRoleSchema.safeParse(options.role).success) {
    return { ok: false, message: "Choose a supported user role.", status: 400 }
  }
  const { page, limit } = options
  const result = await adminApiRequest({
    path: "users",
    searchParams: options,
    schema: usersResponseSchema,
    serviceName: "users",
    fallbackMessage: "Unable to load users.",
    debugLabel: "users-api",
  })

  if (!result.ok) {
    if (result.status === 400 && /property .* should not exist/i.test(result.message)) {
      return { ...result, message: "This backend server is running an older build without the selected user filters. Restart it and try again." }
    }
    return result
  }

  const list = z.array(userSchema).safeParse(result.data.data)

  if (list.success) {
    return {
      ok: true,
      users: await resolveUserNames(list.data),
      pagination: readPagination(
        result.data.meta,
        { page, limit },
        list.data.length
      ),
    }
  }

  const paginated = paginatedUsersSchema.safeParse(result.data.data)

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
    users: await resolveUserNames(users),
    pagination: readPagination(
      paginated.data.pagination ?? paginated.data.meta ?? paginated.data,
      { page, limit },
      users.length
    ),
  }
}
