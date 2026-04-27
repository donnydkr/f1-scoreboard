import { NextResponse } from "next/server";
import { hasValidAdminSession } from "@/lib/auth";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (await hasValidAdminSession(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"]
};
