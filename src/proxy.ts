import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession, decrypt } from "./lib/auth";

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("session")?.value;
  const parsed = await decrypt(sessionCookie);

  const isAuthPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/admin/login";

  if (!parsed && !isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (parsed) {
    const isKidRoute = request.nextUrl.pathname.startsWith("/kid");
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

    if (parsed.role === "KID" && isAdminRoute) {
      return NextResponse.redirect(new URL("/kid/dashboard", request.url));
    }

    if (parsed.role === "ADMIN" && isKidRoute) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    if (isAuthPage) {
      if (parsed.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/kid/dashboard", request.url));
      }
    }
  }

  return await updateSession(request) || NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
