"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ChevronDownIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserFilters } from "@/lib/users/get-users"

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"

export function UserFiltersForm({ filters }: { filters: UserFilters }) {
  const moreFiltersRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      const details = moreFiltersRef.current
      if (details?.open && !details.contains(event.target as Node)) details.open = false
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && moreFiltersRef.current?.open) {
        moreFiltersRef.current.open = false
      }
    }

    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  const moreCount = [
    filters.profileStatus, filters.joined, filters.createdFrom,
    filters.createdTo, filters.sortBy, filters.sortOrder,
  ].filter(Boolean).length

  return (
    <Card size="sm" className="overflow-visible">
      <CardContent>
        <form key={JSON.stringify(filters)} action="/dashboard/users">
          <div className="flex flex-wrap items-end gap-3">
            <div className="relative min-w-52 flex-1">
              <Label htmlFor="user-search" className="sr-only">Name or email</Label>
              <SearchIcon aria-hidden="true" className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input id="user-search" name="search" defaultValue={filters.search} maxLength={200}
                placeholder="Search name or email" className="h-9 pl-9" />
            </div>
            <div className="min-w-32 flex-1 sm:max-w-40">
              <Label htmlFor="user-role" className="mb-1 block text-xs">Role</Label>
              <select id="user-role" name="role" defaultValue={filters.role ?? ""} className={selectClass}>
                <option value="">All roles</option>
                {(["USER", "ADMIN", "INSTRUCTOR", "INSTITUTION", "RECRUITER"] as const).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            <div className="min-w-32 flex-1 sm:max-w-40">
              <Label htmlFor="email-verified" className="mb-1 block text-xs">Email verified</Label>
              <select id="email-verified" name="emailVerified" defaultValue={filters.emailVerified ?? ""} className={selectClass}>
                <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
              </select>
            </div>
            <div className="min-w-32 flex-1 sm:max-w-40">
              <Label htmlFor="phone-verified" className="mb-1 block text-xs">Phone verified</Label>
              <select id="phone-verified" name="phoneVerified" defaultValue={filters.phoneVerified ?? ""} className={selectClass}>
                <option value="">Any</option><option value="true">Yes</option><option value="false">No</option>
              </select>
            </div>
            <div className="min-w-32 flex-1 sm:max-w-40">
              <Label htmlFor="user-country" className="mb-1 block text-xs">Countries</Label>
              <Input id="user-country" name="countries" defaultValue={filters.countries} placeholder="GB,PK" className="h-9" />
            </div>
            <details ref={moreFiltersRef} className="group relative ml-auto">
              <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <SlidersHorizontalIcon aria-hidden="true" className="size-4" />
                More filters
                {moreCount > 0 ? <span className="rounded-full bg-primary/10 px-1.5 text-xs text-primary">{moreCount}</span> : null}
                <ChevronDownIcon aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-full z-30 mt-2 w-[min(90vw,30rem)] rounded-xl border bg-popover p-4 shadow-xl">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="user-status">Profile status</Label>
                    <select id="user-status" name="profileStatus" defaultValue={filters.profileStatus ?? ""} className={selectClass}>
                      <option value="">All statuses</option>
                      {(["INCOMPLETE", "PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED", "REJECTED"] as const).map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="joined">Joined on</Label>
                    <Input id="joined" name="joined" type="date" defaultValue={filters.joined} className="h-9" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="created-from">Created from</Label>
                    <Input id="created-from" name="createdFrom" type="date" defaultValue={filters.createdFrom} className="h-9" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="created-to">Created to</Label>
                    <Input id="created-to" name="createdTo" type="date" defaultValue={filters.createdTo} className="h-9" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="sort-by">Sort by</Label>
                    <select id="sort-by" name="sortBy" defaultValue={filters.sortBy ?? ""} className={selectClass}>
                      <option value="">Default (newest joined)</option>
                      <option value="createdAt">Joined</option><option value="lastLogin">Last login</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5 sm:col-span-2">
                    <Label htmlFor="sort-order">Order</Label>
                    <select id="sort-order" name="sortOrder" defaultValue={filters.sortOrder ?? ""} className={selectClass}>
                      <option value="">Default (newest first)</option>
                      <option value="desc">Newest first</option><option value="asc">Oldest first</option>
                    </select>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Use Joined on alone, or use Created from and Created to as a range. Dates use UTC.</p>
              </div>
            </details>
            <Button type="submit" className="h-9">Apply</Button>
            <Button asChild variant="ghost" className="h-9"><Link href="/dashboard/users">Clear</Link></Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
