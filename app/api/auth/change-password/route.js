import { NextResponse } from "next/server";
import { adminText } from "@/lib/admin-text";
import {
  applyAdminSessionCookies,
  changeAdminPassword,
  getAdminAuthState,
  isValidAdminSessionToken,
  verifyAdminCredentials
} from "@/lib/auth";
import { ADMIN_DEFAULT_USERNAME, ADMIN_SESSION_COOKIE } from "@/lib/constants";

export async function POST(request) {
  try {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!isValidAdminSessionToken(sessionToken)) {
      return NextResponse.json({ error: adminText.auth.notAuthenticated }, { status: 401 });
    }

    const body = await request.json();
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword.trim() : "";

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: adminText.auth.passwordFieldsRequired }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: adminText.auth.passwordTooShort }, { status: 400 });
    }

    const authState = await getAdminAuthState();
    const validCurrentPassword = await verifyAdminCredentials(ADMIN_DEFAULT_USERNAME, currentPassword);

    if (!validCurrentPassword.ok) {
      return NextResponse.json({ error: adminText.auth.currentPasswordInvalid }, { status: 401 });
    }

    if (!authState.hasStoredPassword && newPassword === currentPassword) {
      return NextResponse.json({ error: adminText.auth.passwordMustChangeFromDefault }, { status: 400 });
    }

    await changeAdminPassword(newPassword);

    const response = NextResponse.json({ success: true });
    return applyAdminSessionCookies(response, false);
  } catch (error) {
    console.error("Failed to change admin password", error);

    return NextResponse.json({ error: adminText.auth.passwordChangeError }, { status: 500 });
  }
}
