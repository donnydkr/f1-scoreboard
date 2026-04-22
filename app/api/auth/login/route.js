import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";
import { adminText } from "@/lib/admin-text";

export async function POST(request) {
  const body = await request.json();
  const accessCode = body?.accessCode?.trim();

  if (!process.env.ADMIN_ACCESS_CODE || !process.env.ADMIN_SESSION_TOKEN) {
    return NextResponse.json(
      { error: adminText.api.loginNotConfigured },
      { status: 500 }
    );
  }

  if (!accessCode || accessCode !== process.env.ADMIN_ACCESS_CODE) {
    return NextResponse.json({ error: adminText.api.wrongAccessCode }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: process.env.ADMIN_SESSION_TOKEN,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  return response;
}
