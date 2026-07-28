"use client"

import Link from "next/link"
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout } from "@/hooks/use-logout"

type AccountMenuProps = {
  user: {
    email: string
    name?: string | null
  }
}

function getInitials(name: string | null | undefined, email: string) {
  if (!name?.trim()) {
    return email.charAt(0).toUpperCase()
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
}

export function AccountMenu({ user }: AccountMenuProps) {
  const logoutMutation = useLogout()
  const displayName = user.name?.trim() || "Administrator"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 max-w-64 gap-2 rounded-full px-1.5 sm:rounded-lg sm:pr-2"
          aria-label="Open account menu"
        >
          <Avatar className="size-8 ring-1 ring-border">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-1 text-left sm:block">
            <span className="block truncate text-sm font-medium">
              {displayName}
            </span>
            <span className="block truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          </span>
          <ChevronDownIcon className="hidden size-4 text-muted-foreground sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate font-medium">{displayName}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <SettingsIcon />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logoutMutation.isPending}
          onSelect={() => logoutMutation.mutate()}
        >
          <LogOutIcon />
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
