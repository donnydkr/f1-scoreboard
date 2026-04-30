import { NextResponse } from "next/server";
import { deleteDriverWithLapTimes } from "@/db/queries/drivers";
import { adminText } from "@/lib/admin-text";

export async function DELETE(request, context) {
  try {
    const params = await context?.params;
    const id = Number(params?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: adminText.api.driverInvalidId }, { status: 400 });
    }

    const deleted = await deleteDriverWithLapTimes(id);

    if (!deleted) {
      return NextResponse.json({ error: adminText.api.driverNotFound }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      id,
      deletedLapTimeCount: deleted.deletedLapTimeCount,
      message: adminText.api.driverDeleted
    });
  } catch (error) {
    console.error("Failed to delete driver", error);

    return NextResponse.json(
      { error: adminText.api.driverDeleteServerError },
      { status: 500 }
    );
  }
}
