import { NextResponse } from "next/server";
import { createDriver, updateDriverNameByCurrentName } from "@/db/queries/drivers";
import { adminText } from "@/lib/admin-text";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = requireText(body?.name);

    if (!name) {
      return NextResponse.json({ error: adminText.api.driverRequired }, { status: 400 });
    }

    const driver = await createDriver(name);
    return NextResponse.json({ data: driver }, { status: 201 });
  } catch (error) {
    console.error("Failed to create driver", error);

    return NextResponse.json(
      { error: adminText.api.driverCreateServerError },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const currentName = requireText(body?.currentName);
    const newName = requireText(body?.newName);

    if (!currentName || !newName) {
      return NextResponse.json({ error: adminText.api.driverRequired }, { status: 400 });
    }

    const result = await updateDriverNameByCurrentName(currentName, newName);

    if (!result) {
      return NextResponse.json({ error: adminText.api.driverNotFound }, { status: 404 });
    }

    if (result.conflict) {
      return NextResponse.json({ error: adminText.api.driverNameAlreadyExists }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
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
