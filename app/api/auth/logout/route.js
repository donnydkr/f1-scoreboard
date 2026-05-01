import { NextResponse } from "next/server";
import { clearAdminSessionCookies } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  return clearAdminSessionCookies(response);
}
