import "server-only"
import { adminApiRequest } from "@/lib/api/admin-api-client"
import { dropdownNameSchema, dropdownResponseSchema } from "./schema"
export async function getDropdown(name: string) {
  if (!dropdownNameSchema.safeParse(name).success) return { ok: false as const, status: 400, message: "Invalid dropdown name." }
  const result = await adminApiRequest({ path: `dropdowns/admin/${encodeURIComponent(name)}`, schema: dropdownResponseSchema, serviceName: "dropdowns" })
  return result.ok ? { ok: true as const, dropdown: result.data.data } : result
}
