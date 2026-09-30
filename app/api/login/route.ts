import { NextResponse } from "next/server";
import { accessPassword, matchesPassword, sessionCookie, sessionValue } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ configured: Boolean(accessPassword()) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!accessPassword()) return NextResponse.json({ error: "Access is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { password?: string };
  if (typeof body.password !== "string" || !matchesPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect access password." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, sessionValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

