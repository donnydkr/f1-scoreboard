import { NextResponse } from "next/server";
import { adminText } from "@/lib/admin-text";
import { applyAdminSessionCookies, verifyAdminCredentials } from "@/lib/auth";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const username = requireText(body?.username);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) {
      return NextResponse.json({ error: adminText.auth.missingCredentials }, { status: 400 });
    }

    const result = await verifyAdminCredentials(username, password);

    if (!result.ok) {
      return NextResponse.json({ error: adminText.auth.invalidCredentials }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      mustChangePassword: result.mustChangePassword
    });

    return applyAdminSessionCookies(response, result.mustChangePassword);
  } catch (error) {
    console.error("Failed to login", error);

    return NextResponse.json({ error: adminText.auth.loginError }, { status: 500 });
  }
}
