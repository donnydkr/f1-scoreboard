import { NextResponse } from "next/server";
import { deleteDriverWithLapTimes, updateDriverName } from "@/db/queries/drivers";
import { adminText } from "@/lib/admin-text";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

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

export async function PATCH(request, context) {
  try {
    const params = await context?.params;
    const id = Number(params?.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: adminText.api.driverInvalidId }, { status: 400 });
    }

    const body = await request.json();
    const name = requireText(body?.name);

    if (!name) {
      return NextResponse.json({ error: adminText.api.driverRequired }, { status: 400 });
    }

    const result = await updateDriverName(id, name);

    if (!result) {
      return NextResponse.json({ error: adminText.api.driverNotFound }, { status: 404 });
    }

    if (result.conflict) {
      return NextResponse.json({ error: adminText.api.driverNameAlreadyExists }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      id,
      data: result.driver,
      updatedLapTimeCount: result.updatedLapTimeCount,
      renamed: result.renamed
    });
  } catch (error) {
    console.error("Failed to rename driver", error);

    return NextResponse.json(
      { error: adminText.api.driverRenameServerError },
      { status: 500 }
    );
  }
}
