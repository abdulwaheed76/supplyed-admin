import { auth } from "@/auth"
import { NextResponse, type NextRequest, type NextFetchEvent, type NextMiddleware } from "next/server"

/**
 * Route gating only. The `authorized` callback in `auth.ts` decides what passes;
 * this file exists to attach it to the matcher below.
 *
 * Resolving the session here also gives the `jwt` callback a context that can
 * persist a rotated token — Server Components cannot set cookies, so a refresh
 * triggered during render would be thrown away. Keeping the matcher ahead of
 * every authenticated route means the token is already fresh by the time a page
 * renders.
 */
const authProxy = auth as NextMiddleware;

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const result = await authProxy(request, event);
  if (!result) return NextResponse.next();
  if (!result.headers.has("x-middleware-next")) return result;
  const updated = new NextResponse(null, { headers: result.headers }).cookies.getAll();
  const jar = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value]));
  for (const cookie of updated) {
    if (!cookie.value || cookie.maxAge === 0) jar.delete(cookie.name);
    else jar.set(cookie.name, cookie.value);
  }
  const headers = new Headers(request.headers);
  headers.set("cookie", [...jar].map(([name, value]) => `${name}=${value}`).join("; "));
  const response = NextResponse.next({ request: { headers } });
  for (const cookie of result.headers.getSetCookie()) response.headers.append("set-cookie", cookie);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth(?:/|$)).*)"],
}
