import { getDropdowns } from "@/lib/dropdowns/get-dropdowns"
import { DropdownsTable } from "@/components/dropdowns/dropdowns-table"
import { DropdownLoadError } from "@/components/dropdowns/dropdown-load-error"
export default async function DropdownsPage() {
 const result = await getDropdowns()
 return <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6"><div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Reference library</p><h1 className="text-2xl font-semibold tracking-tight">Dropdown library</h1><p className="mt-2 text-sm text-muted-foreground">Manage the choices used across SupplyEd, their domains, and subject–skill relationships.</p></div>{result.ok ? <DropdownsTable dropdowns={result.dropdowns} /> : <DropdownLoadError {...result} href="/dashboard/dropdowns" />}</div>
}
