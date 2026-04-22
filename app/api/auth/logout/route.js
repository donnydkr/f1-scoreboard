import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export async function POST(request) {
  const appUrl = process.env.APP_URL || request.url;
  const response = NextResponse.redirect(new URL("/admin/login", appUrl));

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  return response;
}
