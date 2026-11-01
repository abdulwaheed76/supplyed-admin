import { z } from "zod"

export const USER_ROLES = ["ADMIN", "INSTRUCTOR", "INSTITUTION"] as const
export const CREATE_USER_ROLES = ["INSTRUCTOR", "INSTITUTION"] as const
export const userRoleSchema = z.enum(USER_ROLES)
export const createUserRoleSchema = z.enum(CREATE_USER_ROLES)
export type UserRole = z.infer<typeof userRoleSchema>
export type CreateUserRole = z.infer<typeof createUserRoleSchema>
