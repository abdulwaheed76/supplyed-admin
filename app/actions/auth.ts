"use server"

import { cookies } from "next/headers"

import { getClearedSessionCookies } from "@/lib/auth/session-cookie"

export async function logoutAction() {
  const cookieStore = await cookies()

  for (const cookie of getClearedSessionCookies()) {
    cookieStore.set(cookie)
  }

  return { ok: true as const }
}
