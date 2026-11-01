import "server-only"
import { adminApiRequest } from "@/lib/api/admin-api-client"
import { dropdownListResponseSchema } from "./schema"
export async function getDropdowns() {
  const result = await adminApiRequest({ path: "dropdowns/admin", schema: dropdownListResponseSchema, serviceName: "dropdowns" })
  return result.ok ? { ok: true as const, dropdowns: result.data.data.dropdowns } : result
}
