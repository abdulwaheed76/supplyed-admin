import { redirect } from "next/navigation"

import { getCurrentSession } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login?next=/dashboard")
  }

  return children
}
