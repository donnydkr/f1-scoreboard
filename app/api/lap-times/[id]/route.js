import { NextResponse } from "next/server";
import { deleteLapTimeById } from "@/db/queries/lap-times";
import { hasValidAdminSession } from "@/lib/auth";
import { adminText } from "@/lib/admin-text";

export async function DELETE(request, context) {
  try {
    if (!hasValidAdminSession(request)) {
      return NextResponse.json({ error: adminText.api.unauthorized }, { status: 401 });
    }

    const params = await context?.params;
    const id = Number(params?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: adminText.api.lapTimeInvalidId }, { status: 400 });
    }

    const deleted = await deleteLapTimeById(id);

    if (!deleted) {
      return NextResponse.json({ error: adminText.api.lapTimeNotFound }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete lap time", error);

    return NextResponse.json(
      { error: adminText.api.lapTimeDeleteServerError },
      { status: 500 }
    );
  }
}
