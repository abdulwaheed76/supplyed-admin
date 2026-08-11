"use server"

import { signOut } from "@/auth"

export async function logoutAction() {
  // The caller handles navigation, so Auth.js only needs to clear the session.
  await signOut({ redirect: false })

  return { ok: true as const }
}
