import { NextResponse } from "next/server";
import { clearAdminSessionCookies } from "@/lib/auth";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/admin/login?logged_out=1", request.url));
  return clearAdminSessionCookies(response);
}
