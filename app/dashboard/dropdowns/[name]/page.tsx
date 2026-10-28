import Link from "next/link"
import { notFound } from "next/navigation"
import { getDropdown } from "@/lib/dropdowns/get-dropdown"
import { dropdownNameSchema } from "@/lib/dropdowns/schema"
import { DropdownEditor } from "@/components/dropdowns/dropdown-editor"
import { DropdownLoadError } from "@/components/dropdowns/dropdown-load-error"
export default async function DropdownPage({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<{ subject?: string }> }) {
 const { name } = await params
 if (!dropdownNameSchema.safeParse(name).success) notFound()
 const [result, subjects, query] = await Promise.all([getDropdown(name), name === "skill" ? getDropdown("subject") : Promise.resolve(null), searchParams])
 if (!result.ok && result.status === 404) notFound()
 return <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6"><Link className="text-sm text-muted-foreground hover:underline" href="/dashboard/dropdowns">? Dropdown library</Link>{result.ok ? <DropdownEditor key={name} initial={result.dropdown} subjects={subjects?.ok ? subjects.dropdown.options : []} subjectCollectionActive={subjects?.ok ? subjects.dropdown.isActive : undefined} subjectError={subjects && !subjects.ok ? subjects.message : undefined} initialSubject={typeof query.subject === "string" ? query.subject : ""} /> : <DropdownLoadError {...result} href={`/dashboard/dropdowns/${name}`} />}</div>
}
