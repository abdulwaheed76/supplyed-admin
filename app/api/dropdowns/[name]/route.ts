import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { adminApiRequest } from "@/lib/api/admin-api-client"
import { getDropdown } from "@/lib/dropdowns/get-dropdown"
import { dropdownNameSchema, dropdownPatchSchema, dropdownDeleteSchema, dropdownResponseSchema } from "@/lib/dropdowns/schema"
type Context = { params: Promise<{ name: string }> }
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } })
export async function GET(_request: NextRequest, { params }: Context) {
  const result = await getDropdown((await params).name)
  return result.ok ? respond({ dropdown: result.dropdown }) : respond(result, result.status)
}
async function mutate(request: NextRequest, { params }: Context, method: "PATCH" | "DELETE") {
  const origin = request.headers.get("origin")
  if (origin && origin !== request.nextUrl.origin) return respond({ message: "Cross-origin changes are not allowed." }, 403)
  const { name } = await params
  if (!dropdownNameSchema.safeParse(name).success) return respond({ message: "Invalid dropdown name." }, 400)
  const body: unknown = await request.json().catch(() => null)
  const parsed = (method === "PATCH" ? dropdownPatchSchema : dropdownDeleteSchema).safeParse(body)
  if (!parsed.success) return respond({ message: parsed.error.issues[0]?.message ?? "Invalid request." }, 400)
  const result = await adminApiRequest({ path: `dropdowns/${encodeURIComponent(name)}`, method, body: parsed.data, schema: dropdownResponseSchema, serviceName: "dropdowns" })
  if (!result.ok) return respond({ message: result.message, code: result.code, requestId: result.requestId }, result.status)
  revalidatePath("/dashboard/dropdowns")
  revalidatePath(`/dashboard/dropdowns/${name}`)
  return respond({ dropdown: result.data.data })
}
export const PATCH = (request: NextRequest, context: Context) => mutate(request, context, "PATCH")
export const DELETE = (request: NextRequest, context: Context) => mutate(request, context, "DELETE")
