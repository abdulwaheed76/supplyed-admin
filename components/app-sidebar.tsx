"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BoxesIcon,
  ChevronRightIcon,
  FileCheck2Icon,
  LayoutGridIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UsersIcon,
} from "lucide-react"
import { useLogout } from "@/hooks/use-logout"

const navigation = [
  {
    title: "Dashboard",
    url: "/dashboard",
    Icon: LayoutDashboardIcon,
  },
  {
    title: "User management",
    url: "/dashboard/users",
    Icon: UsersIcon,
  },
  {
    title: "Document queue",
    url: "/dashboard/document-queue",
    Icon: FileCheck2Icon,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const logoutMutation = useLogout()
  const isOverviewActive = navigation.some(({ url }) =>
    url === "/dashboard" ? pathname === url : pathname.startsWith(url)
  )

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <BoxesIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Supplyed Admin</span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Operations
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <CollapsiblePrimitive.Root
              defaultOpen
              asChild
            >
              <SidebarMenuItem className="group/collapsible">
                <CollapsiblePrimitive.Trigger asChild>
                  <SidebarMenuButton
                    tooltip="Overview"
                    isActive={isOverviewActive}
                    className="font-medium"
                  >
                    <LayoutGridIcon />
                    <span>Overview</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsiblePrimitive.Trigger>
                <CollapsiblePrimitive.Content>
                  <SidebarMenuSub>
                    {navigation.map(({ Icon, title, url }) => {
                      const isActive =
                        url === "/dashboard"
                          ? pathname === url
                          : pathname.startsWith(url)

                      return (
                        <SidebarMenuSubItem key={title}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link href={url}>
                              <Icon />
                              <span>{title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsiblePrimitive.Content>
              </SidebarMenuItem>
            </CollapsiblePrimitive.Root>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Sign out"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
            >
              <LogOutIcon />
              <span>
                {logoutMutation.isPending ? "Signing out..." : "Sign out"}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
