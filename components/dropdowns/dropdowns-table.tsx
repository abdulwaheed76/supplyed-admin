"use client"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { dropdownReference } from "@/lib/dropdowns/reference"
import type { DropdownSummary } from "@/lib/dropdowns/schema"
export const selectClass = "h-9 rounded-md border bg-background px-3 text-sm"
export function Status({ active }: { active: boolean }) { return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{active ? "Active" : "Retired"}</span> }
export function DropdownsTable({ dropdowns }: { dropdowns: DropdownSummary[] }) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [domain, setDomain] = useState("all")
  const [type, setType] = useState("all")
  const domains = [...new Set(dropdowns.map(d => dropdownReference(d.name).domain))].sort()
  const rows = dropdowns.filter(d =>
    `${d.name} ${d.label}`.toLowerCase().includes(search.toLowerCase()) &&
    (status === "all" || d.isActive === (status === "active")) &&
    (domain === "all" || dropdownReference(d.name).domain === domain) &&
    (type === "all" || d.expandable === (type === "extensible"))
  )
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">{[["Collections", dropdowns.length], ["Active collections", dropdowns.filter(d => d.isActive).length], ["Active options", dropdowns.reduce((sum, d) => sum + d.optionCount, 0)]].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
    <div className="flex flex-wrap gap-3"><Input aria-label="Search collections" placeholder="Search dropdowns by name or label…" className="max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filter by domain" className={selectClass} value={domain} onChange={e => setDomain(e.target.value)}><option value="all">All domains</option>{domains.map(d => <option key={d}>{d}</option>)}</select><select aria-label="Filter by status" className={selectClass} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="retired">Retired</option></select>
      <select aria-label="Filter by collection type" className={selectClass} value={type} onChange={e => setType(e.target.value)}>
        <option value="all">All types</option>
        <option value="fixed">Fixed</option>
        <option value="extensible">Extensible</option>
      </select>
    </div>
    <div className="overflow-hidden rounded-xl border"><Table><TableHeader><TableRow>{["Name", "Display label", "Domain", "Status", "Active options", "Type", "Last updated", ""].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(d => <TableRow key={d.name}><TableCell className="font-mono text-xs">{d.name}</TableCell><TableCell className="font-medium">{d.label}</TableCell><TableCell>{dropdownReference(d.name).domain}</TableCell><TableCell><Status active={d.isActive} /></TableCell><TableCell>{d.optionCount}</TableCell><TableCell>{d.expandable ? "Extensible" : "Fixed"}</TableCell><TableCell>{d.updatedAt.slice(0, 10)}</TableCell><TableCell><Button asChild variant="outline" size="sm"><Link href={`/dashboard/dropdowns/${d.name}`} aria-label={`Manage ${d.label}`}>Manage</Link></Button></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No dropdowns match these filters.</TableCell></TableRow>}</TableBody></Table></div><p className="text-sm text-muted-foreground">{rows.length} collections · Counts include active options inside retired collections. Domains describe where a dropdown is used.</p>
  </div>
}
