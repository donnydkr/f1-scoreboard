import { NextResponse } from "next/server";
import { clearTelemetryData } from "@/db/queries/telemetry";
import { isPasswordChangeRequired, isValidAdminSessionToken } from "@/lib/auth";
import { ADMIN_SESSION_COOKIE } from "@/lib/constants";
import { adminText } from "@/lib/admin-text";
import { resetTelemetryReceiverState } from "@/lib/telemetry-receiver";

export async function DELETE(request) {
  try {
    const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!isValidAdminSessionToken(sessionToken)) {
      return NextResponse.json({ error: adminText.auth.notAuthenticated }, { status: 401 });
    }

    if (await isPasswordChangeRequired()) {
      return NextResponse.json({ error: adminText.auth.passwordChangeRequired }, { status: 403 });
    }

    await clearTelemetryData();
    resetTelemetryReceiverState();

    return NextResponse.json({
      success: true,
      message: adminText.telemetry.clearSuccess
    });
  } catch (error) {
    console.error("Failed to clear telemetry data", error);

    return NextResponse.json(
      { error: adminText.telemetry.clearError },
      { status: 500 }
    );
  }
}
