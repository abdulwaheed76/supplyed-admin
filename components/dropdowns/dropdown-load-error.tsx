import Link from "next/link"
import { Button } from "@/components/ui/button"
export function DropdownLoadError({ message, status, href }: { message: string; status: number; href: string }) {
  return <div role="alert" className="space-y-4 rounded-xl border p-6"><h2 className="font-semibold">Unable to load dropdowns</h2><p>{message}</p>{status === 503 && <p className="text-sm text-muted-foreground">If dropdowns have not been initialized, the backend operator must run migrations and pnpm seed:dropdowns (or pnpm seed:dropdowns:prod for production).</p>}<Button asChild variant="outline"><Link href={status === 401 ? "/login" : href}>{status === 401 ? "Sign in" : "Try again"}</Link></Button></div>
}
