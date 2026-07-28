import { z } from "zod"

import {
  ADMIN_PROFILE_STATUS_TARGETS,
  PROFILE_STATUSES,
} from "@/lib/users/profile-status"

export const profileStatusSchema = z.enum(PROFILE_STATUSES)
export const adminProfileStatusSchema = z.enum(ADMIN_PROFILE_STATUS_TARGETS)
