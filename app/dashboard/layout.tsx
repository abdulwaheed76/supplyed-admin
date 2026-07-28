import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCurrentSession } from "@/lib/auth/session"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getCurrentSession()

  if (!session) {
    redirect("/login?next=/dashboard")
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader user={session} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
