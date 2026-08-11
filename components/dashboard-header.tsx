"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { AccountMenu } from "@/components/account-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type DashboardHeaderProps = {
  user: {
    email: string
    name?: string | null
  }
}

function getPageLabel(pathname: string) {
  if (pathname === "/dashboard/users") {
    return "Users"
  }

  if (pathname.startsWith("/dashboard/users/")) {
    return "User details"
  }

  if (pathname === "/dashboard/document-queue") {
    return "Document queue"
  }

  if (pathname === "/dashboard/jobs") {
    return "Jobs"
  }

  if (pathname === "/dashboard/jobs/new") {
    return "Create job"
  }

  if (pathname.startsWith("/dashboard/jobs/")) {
    return "Job details"
  }

  if (pathname === "/dashboard/settings") {
    return "Account settings"
  }

  return "Dashboard"
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const pageLabel = getPageLabel(pathname)
  const isDashboard = pathname === "/dashboard"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {isDashboard ? (
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            ) : (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <AccountMenu user={user} />
    </header>
  )
}
