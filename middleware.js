import { NextResponse } from "next/server";
import {
  ADMIN_FORCE_PASSWORD_CHANGE_COOKIE,
  ADMIN_SESSION_COOKIE
} from "@/lib/constants";

function hasValidSession(request) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  const expectedToken = process.env.ADMIN_SESSION_TOKEN || "development-admin-session-token";

  return sessionToken === expectedToken;
}

function isProtectedPage(pathname) {
  if (pathname === "/admin/login" || pathname === "/admin/password") {
    return false;
  }

  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isProtectedApi(pathname) {
  return pathname.startsWith("/api/admin/");
}

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasValidSession(request);
  const passwordChangeRequired = request.cookies.get(ADMIN_FORCE_PASSWORD_CHANGE_COOKIE)?.value === "1";
  const isLoginPage = pathname === "/admin/login";
  const isPasswordPage = pathname === "/admin/password";
  const isAuthChangePasswordRoute = pathname === "/api/auth/change-password";
  const isAuthLogoutRoute = pathname === "/api/auth/logout";
  const protectedPage = isProtectedPage(pathname);
  const protectedApi = isProtectedApi(pathname);

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL(passwordChangeRequired ? "/admin/password" : "/admin", request.url));
  }

  if ((protectedPage || protectedApi) && !isLoggedIn) {
    if (protectedApi) {
      return jsonError("Niet ingelogd.", 401);
    }

    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (
    isLoggedIn &&
    passwordChangeRequired &&
    pathname.startsWith("/admin") &&
    !isPasswordPage &&
    !isLoginPage
  ) {
    return NextResponse.redirect(new URL("/admin/password", request.url));
  }

  if (
    isLoggedIn &&
    passwordChangeRequired &&
    protectedApi &&
    !isAuthChangePasswordRoute &&
    !isAuthLogoutRoute
  ) {
    return jsonError("Wijzig eerst het standaard wachtwoord.", 403);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ]
};
