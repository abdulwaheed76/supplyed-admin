"use client"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { optionInputSchema, type DropdownOption, type DropdownDetail } from "@/lib/dropdowns/schema"
export function DropdownOptionDialog({ detail, option, subjects, subjectKey, pending, blocked, feedback, onClose, onSave }: {
 detail: DropdownDetail; option?: DropdownOption; subjects: DropdownOption[]; subjectKey?: string; pending: boolean; blocked: boolean; feedback: ReactNode; onClose: () => void; onSave: (option: DropdownOption) => Promise<boolean>
}) {
 const [draft, setDraft] = useState<DropdownOption>(option ?? { key: "", value: "", label: "", aliases: [], group: null, sortOrder: Math.min(100000, Math.max(-1, ...detail.options.map(o => o.sortOrder)) + 1), isActive: true, isShared: false, subjectKeys: subjectKey ? [subjectKey] : [] })
 const [aliasText, setAliasText] = useState(option?.aliases.join("\n") ?? "")
 const [search, setSearch] = useState("")
 const [error, setError] = useState("")
 const skill = detail.name === "skill"
 const other = draft.key === "other" || draft.value.toLowerCase() === "other"
 const retainAliases = ["subject", "skill", "keyStage"].includes(detail.name)
 const update = (change: Partial<DropdownOption>) => setDraft(d => ({ ...d, ...change }))
 async function submit(e: React.FormEvent) {
  e.preventDefault()
  const aliases = aliasText.split("\n").map(s => s.trim()).filter(Boolean)
  const candidate = { ...draft, aliases, group: draft.group?.trim() || null }
  const parsed = optionInputSchema.safeParse(candidate)
  if (!parsed.success) return setError(parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(" · "))
  if (!option && detail.options.some(o => o.key === draft.key)) return setError("This key already exists, including retired options.")
  if (retainAliases && option?.aliases.some(a => !aliases.includes(a))) return setError("Retain all existing aliases to protect historical matching.")
  if (skill && !draft.isShared && !draft.subjectKeys.length) return setError("Choose at least one subject or mark this skill as shared.")
  if (skill && other && (!draft.isShared || draft.subjectKeys.length)) return setError("The Other skill must be shared and have no subject links.")
  setError("")
  await onSave(candidate)
 }
 return <Dialog open onOpenChange={open => { if (!open && !pending) onClose() }}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{option ? "Edit option" : "Add option"}</DialogTitle><DialogDescription>{detail.label} · Labels can change; existing keys and saved values stay the same.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><fieldset disabled={pending} className="space-y-4">
 <label className="block space-y-1 text-sm">Display label<Input required maxLength={200} value={draft.label} onChange={e => update({ label: e.target.value })} onBlur={() => { if (!option && !draft.key) update({ key: draft.label.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120), value: draft.value || draft.label.slice(0, 100) }) }} /></label>
 <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Key<Input required readOnly={!!option} value={draft.key} maxLength={120} onChange={e => update({ key: e.target.value })} /></label><label className="space-y-1 text-sm">Saved value<Input required readOnly={!!option} value={draft.value} maxLength={100} onChange={e => update({ value: e.target.value })} /></label></div><p className="text-xs text-muted-foreground">Forms save this value. Review it before creation; it cannot be renamed later.</p>
 <div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1 text-sm">Group / subject area<Input maxLength={100} value={draft.group ?? ""} onChange={e => update({ group: e.target.value })} /></label><label className="space-y-1 text-sm">Sort order<Input type="number" required min={0} max={100000} step={1} value={draft.sortOrder} onChange={e => update({ sortOrder: Number(e.target.value) })} /></label></div>
 <label className="block space-y-1 text-sm">Aliases (one per line)<textarea className="min-h-20 w-full rounded-md border p-2" value={aliasText} onChange={e => setAliasText(e.target.value)} /></label><p className="text-xs text-muted-foreground">Up to 50 distinct search aliases.{retainAliases && " Existing aliases must be retained."}</p><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isActive} onChange={e => update({ isActive: e.target.checked })} />Active option</label>
 {skill && <div className="space-y-3 rounded-lg border p-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isShared} onChange={e => update({ isShared: e.target.checked })} />Shared across all subjects</label><p className="text-xs text-muted-foreground">Otherwise, select one or more subjects. Retired links are retained. Other cannot be linked.</p><Input aria-label="Search subjects" placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} /><div className="max-h-48 space-y-2 overflow-y-auto">{subjects.filter(s => s.key !== "other" && s.value.toLowerCase() !== "other" && `${s.label} ${s.value}`.toLowerCase().includes(search.toLowerCase())).map(s => <label key={s.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.subjectKeys.includes(s.key)} onChange={e => update({ subjectKeys: e.target.checked ? [...draft.subjectKeys, s.key] : draft.subjectKeys.filter(k => k !== s.key) })} /><span>{s.label} <span className="text-muted-foreground">({s.value}){!s.isActive && " · Retired"}</span></span></label>)}</div><p className="text-xs">{draft.subjectKeys.length} linked subjects</p></div>}
 </fieldset>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}{feedback}<DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button disabled={pending || blocked} type="submit">{pending ? "Saving…" : "Save option"}</Button></DialogFooter></form></DialogContent></Dialog>
}
