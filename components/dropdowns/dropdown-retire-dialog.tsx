"use client"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
export function DropdownRetireDialog({ label, names, count, pending, blocked, feedback, onClose, onConfirm }: { label: string; names: string[] | null; count: number; pending: boolean; blocked: boolean; feedback: ReactNode; onClose: () => void; onConfirm: () => void }) {
 return <Dialog open onOpenChange={open => { if (!open && !pending) onClose() }}><DialogContent><DialogHeader><DialogTitle>{names ? `Retire ${names.length} option(s)?` : `Retire the entire ${label} dropdown?`}</DialogTitle><DialogDescription>{names ? `Remove ${names.join(", ")} from new selections?` : `Disable ${label}, containing ${count} options? New forms will no longer receive this collection's options.`} Existing profiles and jobs keep their saved values. You can restore this later.</DialogDescription></DialogHeader>{feedback}<DialogFooter><Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button variant="destructive" disabled={pending || blocked} onClick={onConfirm}>{pending ? "Retiring…" : names ? "Retire selected options" : "Retire entire dropdown"}</Button></DialogFooter></DialogContent></Dialog>
}
