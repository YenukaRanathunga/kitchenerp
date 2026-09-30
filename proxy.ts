import { NextRequest, NextResponse } from "next/server";
import { accessPassword, sessionCookie, validSession } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/login" || path === "/api/login") return NextResponse.next();
  if (!accessPassword()) return new NextResponse("Office Stock access is not configured.", { status: 503 });
  if (validSession(request.cookies.get(sessionCookie)?.value)) return NextResponse.next();
  if (path.startsWith("/api/")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.svg).*)"],
};
