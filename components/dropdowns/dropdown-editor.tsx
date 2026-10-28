"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Status, selectClass } from "./dropdowns-table"
import { DropdownOptionDialog } from "./dropdown-option-dialog"
import { DropdownRetireDialog } from "./dropdown-retire-dialog"
import { dropdownReference } from "@/lib/dropdowns/reference"
import type { DropdownDetail, DropdownOption, DropdownPatch, DropdownDelete } from "@/lib/dropdowns/schema"
import { readDropdown } from "@/lib/api/dropdown-api"
import { RouteRequestError } from "@/lib/api/route-request"
import { useDropdowns } from "@/hooks/use-dropdowns"

type Change = { method: "PATCH"; body: DropdownPatch } | { method: "DELETE"; body: DropdownDelete }
export function DropdownEditor({ initial, subjects, subjectCollectionActive, subjectError, initialSubject = "" }: { initial: DropdownDetail; subjects: DropdownOption[]; subjectCollectionActive?: boolean; subjectError?: string; initialSubject?: string }) {
 const [detail, setDetail] = useState(initial)
 const [label, setLabel] = useState(initial.label)
 const [search, setSearch] = useState("")
 const [status, setStatus] = useState("all")
 const [subject, setSubject] = useState(initialSubject)
 const [page, setPage] = useState(0)
 const [selected, setSelected] = useState<string[]>([])
 const [editing, setEditing] = useState<DropdownOption | "new" | null>(null)
 const [retiring, setRetiring] = useState<string[] | "collection" | null>(null)
 const [error, setError] = useState<Error | null>(null)
 const [notice, setNotice] = useState("")
 const [conflict, setConflict] = useState(false)
 const [fresh, setFresh] = useState(false)
 const [loading, setLoading] = useState(false)
 const lock = useRef(false)
 const mutation = useDropdowns()
 const pending = mutation.isPending || loading
 const blocked = pending || conflict
 const reference = dropdownReference(detail.name)
 async function refreshConflict() {
  setLoading(true)
  try { const result = await readDropdown(detail.name); setDetail(result.dropdown); setFresh(true) }
  catch (e) { setError(e instanceof Error ? e : new Error("Unable to load latest values.")); setFresh(false) }
  finally { setLoading(false) }
 }
 async function apply(change: Change) {
  if (lock.current || conflict) return false
  lock.current = true
  setError(null); setNotice("")
  try {
   const result = await mutation.mutateAsync({ name: detail.name, change })
   setDetail(result.dropdown); setLabel(result.dropdown.label); setSelected([])
   setNotice("Changes saved. Public forms will receive the updated choices when they refresh.")
   return true
  } catch (e) {
   const failure = e instanceof Error ? e : new Error("Unable to save changes.")
   setError(failure)
   if (failure instanceof RouteRequestError && failure.status === 409) { setConflict(true); setFresh(false); await refreshConflict() }
   return false
  } finally { lock.current = false }
 }
 const latestEditing = editing && editing !== "new" ? detail.options.find(o => o.key === editing.key) : null
 const feedback = <>{error && <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 p-3 text-sm"><p>{error.message}</p>{error instanceof RouteRequestError && error.status === 401 && <Link className="underline" href="/login" target="_blank">Sign in in a new tab, then retry here</Link>}{error instanceof RouteRequestError && error.requestId && <p className="text-xs">Support reference: {error.requestId}</p>}</div>}{conflict && <div role="alert" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><p>This dropdown changed. Your draft is preserved. Review the latest values before saving again.</p>{fresh ? <><p>Latest: {detail.label} · Revision {detail.revision} · {detail.isActive ? "Active" : "Retired"}</p>{latestEditing && <details open><summary>Latest saved option</summary><pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(latestEditing, null, 2)}</pre></details>}{retiring && retiring !== "collection" && <ul>{detail.options.filter(o => retiring.includes(o.key)).map(o => <li key={o.key}>{o.label}: {o.isActive ? "Active" : "Retired"}</li>)}</ul>}<Button type="button" variant="outline" disabled={pending} onClick={() => { setConflict(false); setError(null) }}>I reviewed the latest values</Button></> : <Button type="button" variant="outline" disabled={pending} onClick={refreshConflict}>Load latest values</Button>}</div>}</>
 const filtered = detail.options.filter(o => `${o.label} ${o.value} ${o.key} ${o.group ?? ""} ${o.aliases.join(" ")}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || o.isActive === (status === "active")) && (!subject || o.subjectKeys.includes(subject) || o.isShared)).sort((a,b) => a.sortOrder-b.sortOrder || a.key.localeCompare(b.key))
 const pages = Math.max(1, Math.ceil(filtered.length/50))
 const currentPage = Math.min(page, pages-1)
 const rows = filtered.slice(currentPage*50, currentPage*50+50)
 const chosenSubject = subjects.find(s => s.key === subject)
 const canLink = !subjectError && detail.name === "skill"
 function openEdit(option: DropdownOption | "new") { setError(null); setEditing(option) }
 return <div className="space-y-6">
 <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{reference.domain}</p><h1 className="mt-2 text-2xl font-semibold">{detail.label}</h1><p className="mt-1 text-sm text-muted-foreground">{detail.name} · Revision {detail.revision} · Updated {detail.updatedAt.slice(0, 10)}</p></div><Status active={detail.isActive} /></div>
 {!detail.isActive && <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">This entire collection is retired. Even individually active options are unavailable to public forms until you restore the collection.</p>}
 <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><div className="space-y-4 rounded-xl border p-5"><h2 className="font-semibold">Collection settings</h2><form className="flex flex-wrap items-end gap-3" onSubmit={async e => { e.preventDefault(); await apply({ method: "PATCH", body: { revision: detail.revision, label } }) }}><label className="min-w-48 flex-1 space-y-1 text-sm">Display label<Input required maxLength={200} value={label} disabled={pending} onChange={e => setLabel(e.target.value)} /></label><Button disabled={blocked || label.trim() === detail.label}>Save label</Button></form><div className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted-foreground">{detail.expandable ? "Extensible: new options can be added." : "Fixed: edit existing options only."}</span>{detail.isActive ? <Button variant="outline" size="sm" disabled={blocked} onClick={() => { setError(null); setRetiring("collection") }}>Retire entire dropdown</Button> : <Button variant="outline" size="sm" disabled={blocked} onClick={() => apply({ method: "PATCH", body: { revision: detail.revision, isActive: true } })}>Restore dropdown</Button>}</div></div><div className="space-y-2 rounded-xl border bg-muted/30 p-5"><h2 className="font-semibold">Domain & usage</h2><p className="text-sm">{reference.domain}</p><p className="text-sm text-muted-foreground">{reference.controlIds?.length ? `Controls: ${reference.controlIds.join(", ")}` : "Reference choices for the associated application workflows."}</p><details className="text-xs text-muted-foreground"><summary className="cursor-pointer">Integration references</summary><ul className="mt-2 space-y-1 break-all">{reference.sources?.map(s => <li key={s}>{s}</li>)}</ul></details></div></div>
 {["subject", "skill"].includes(detail.name) && <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm"><p>Teachers and jobs use subject-linked skills plus shared skills. School staffing needs uses subjects only. Adding a subject does not automatically add skills.</p>{detail.name === "subject" ? <p>Save a subject, then choose <strong>Manage skills</strong> on its row to link existing skills or add new ones.</p> : <p>A skill may link to several subjects. Non-shared skills need at least one link; Other is shared and cannot link to subjects.</p>}<p className="text-muted-foreground">Custom names entered by users do not automatically become library options.</p></div>}
 {subjectError && <p role="alert" className="text-sm text-destructive">Subject picker unavailable: {subjectError}. Reload this page to retry; skill editing is disabled until subjects load.</p>}
 {detail.name === "skill" && subjectCollectionActive === false && <p className="text-sm text-amber-800">The Subjects collection is retired. Saved links remain, but linked subjects are unavailable for new public selections.</p>}
 {!editing && !retiring && feedback}{notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
 <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Options</h2><p className="text-sm text-muted-foreground">{detail.options.length} total · {detail.options.filter(o => o.isActive).length} active · {detail.options.filter(o => !o.isActive).length} retired</p></div><div className="flex gap-2"><Button variant="outline" disabled={blocked || !selected.length} onClick={() => { setError(null); setRetiring(selected) }}>Retire selected ({selected.length})</Button>{detail.expandable && <Button disabled={blocked || (detail.name === "skill" && !canLink)} onClick={() => openEdit("new")}>Add option</Button>}</div></div>
 <div className="flex flex-wrap gap-3"><Input aria-label="Search options" className="max-w-sm" placeholder="Search labels, values, groups or aliases…" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /><select aria-label="Option status" className={selectClass} value={status} onChange={e => { setStatus(e.target.value); setPage(0) }}><option value="all">All statuses</option><option value="active">Active</option><option value="retired">Retired</option></select>{detail.name === "skill" && <select aria-label="Filter skills by subject" className={`${selectClass} max-w-full`} value={subject} onChange={e => { setSubject(e.target.value); setPage(0) }}><option value="">All subjects</option>{subjects.filter(s => s.key !== "other" && s.value.toLowerCase() !== "other").map(s => <option key={s.key} value={s.key}>{s.label}{!s.isActive && " (retired)"}</option>)}</select>}{!!selected.length && <Button variant="ghost" disabled={pending} onClick={() => setSelected([])}>Clear selection</Button>}</div>
 {chosenSubject && <p className="text-sm text-muted-foreground">Showing skills linked to {chosenSubject.label}, plus shared skills. New skills will start with this subject selected. Clear this filter to find and link other existing skills.</p>}
 <div className="overflow-hidden rounded-xl border"><Table><TableHeader><TableRow>{["Select", "Label", "Saved value", "Key", "Group", "Order", "Status", ...(detail.name === "skill" ? ["Shared", "Linked subjects"] : []), "Actions"].map(h => <TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(o => <TableRow key={o.key}><TableCell><input aria-label={`Select ${o.label} for retirement`} type="checkbox" checked={selected.includes(o.key)} disabled={blocked || !o.isActive || (!selected.includes(o.key) && selected.length >= 250)} onChange={e => setSelected(keys => e.target.checked ? [...keys, o.key] : keys.filter(k => k !== o.key))} /></TableCell><TableCell className="font-medium">{o.label}</TableCell><TableCell>{o.value}</TableCell><TableCell className="font-mono text-xs">{o.key}</TableCell><TableCell>{o.group ?? "—"}</TableCell><TableCell>{o.sortOrder}</TableCell><TableCell><Status active={o.isActive} /></TableCell>{detail.name === "skill" && <><TableCell>{o.isShared ? "Yes" : "No"}</TableCell><TableCell className="max-w-64 whitespace-normal">{o.subjectKeys.map(k => { const s = subjects.find(s => s.key === k); return s ? `${s.label}${s.isActive ? "" : " (retired)"}` : k }).join(", ") || "—"}</TableCell></>}<TableCell><div className="flex gap-2"><Button size="sm" variant="outline" disabled={blocked || (detail.name === "skill" && !canLink)} onClick={() => openEdit(o)}>Edit</Button>{o.isActive ? <Button size="sm" variant="ghost" disabled={blocked} onClick={() => { setError(null); setRetiring([o.key]) }}>Retire</Button> : <Button size="sm" variant="ghost" disabled={blocked} onClick={() => apply({ method: "PATCH", body: { revision: detail.revision, options: [{ key: o.key, value: o.value, label: o.label, isActive: true }] } })}>Restore</Button>}{detail.name === "subject" && o.key !== "other" && o.value.toLowerCase() !== "other" && <Button asChild size="sm" variant="ghost"><Link href={`/dashboard/dropdowns/skill?subject=${encodeURIComponent(o.key)}`}>Manage skills</Link></Button>}</div></TableCell></TableRow>)}{!rows.length && <TableRow><TableCell colSpan={detail.name === "skill" ? 10 : 8} className="py-10 text-center text-muted-foreground">No options match these filters.</TableCell></TableRow>}</TableBody></Table></div>
 <div className="flex items-center justify-between gap-3 text-sm"><p>{filtered.length} matching options · Page {currentPage+1} of {pages}</p><div className="flex gap-2"><Button variant="outline" disabled={!currentPage} onClick={() => setPage(currentPage-1)}>Previous</Button><Button variant="outline" disabled={currentPage+1 >= pages} onClick={() => setPage(currentPage+1)}>Next</Button></div></div>
 {editing && <DropdownOptionDialog detail={detail} option={editing === "new" ? undefined : editing} subjects={subjects} subjectKey={chosenSubject?.key} pending={pending} blocked={conflict} feedback={feedback} onClose={() => setEditing(null)} onSave={async option => { const saved = await apply({ method: "PATCH", body: { revision: detail.revision, options: [option] } }); if (saved) setEditing(null); return saved }} />}
 {retiring && <DropdownRetireDialog label={`${detail.label} (${detail.name})`} names={retiring === "collection" ? null : retiring.map(k => detail.options.find(o => o.key === k)?.label ?? k)} count={detail.options.length} pending={pending} blocked={conflict} feedback={feedback} onClose={() => setRetiring(null)} onConfirm={async () => { if (retiring !== "collection" && !retiring.length) return; if (await apply({ method: "DELETE", body: { revision: detail.revision, ...(retiring === "collection" ? {} : { optionKeys: retiring }) } })) setRetiring(null) }} />}
 </div>
}
