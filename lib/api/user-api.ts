import { routeRequest } from "@/lib/api/route-request"

/** The backend returns no body for a deletion, so there is nothing to parse. */
export async function deleteUser(id: string): Promise<void> {
  await routeRequest(`/api/users/${encodeURIComponent(id.slice(0, 128))}`, {
    method: "DELETE",
    fallbackMessage: "Unable to delete the user.",
  })
}
