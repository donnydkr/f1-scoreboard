import { NextResponse } from "next/server";
import { createDriver } from "@/db/queries/drivers";
import { hasValidAdminSession } from "@/lib/auth";
import { adminText } from "@/lib/admin-text";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function POST(request) {
  try {
    if (!hasValidAdminSession(request)) {
      return NextResponse.json({ error: adminText.api.unauthorized }, { status: 401 });
    }

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
