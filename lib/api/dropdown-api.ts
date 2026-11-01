import { routeRequest } from "./route-request"
import { dropdownRouteResponseSchema, type DropdownPatch, type DropdownDelete } from "@/lib/dropdowns/schema"
export const readDropdown = (name: string) => routeRequest(`/api/dropdowns/${encodeURIComponent(name)}`, { method: "GET", schema: dropdownRouteResponseSchema })
export const saveDropdown = ({ name, change }: { name: string; change: { method: "PATCH"; body: DropdownPatch } | { method: "DELETE"; body: DropdownDelete } }) => routeRequest(`/api/dropdowns/${encodeURIComponent(name)}`, { ...change, schema: dropdownRouteResponseSchema })
