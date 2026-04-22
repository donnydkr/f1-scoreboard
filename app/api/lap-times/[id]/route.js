import { NextResponse } from "next/server";
import { deleteLapTimeById } from "@/db/queries/lap-times";
import { hasValidAdminSession } from "@/lib/auth";

export async function DELETE(request, context) {
  try {
    if (!hasValidAdminSession(request)) {
      return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
    }

    const id = Number(context?.params?.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Ongeldig record-id." }, { status: 400 });
    }

    const deleted = await deleteLapTimeById(id);
    if (!deleted) {
      return NextResponse.json({ error: "Tijd niet gevonden." }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete lap time", error);

    return NextResponse.json(
      { error: "Verwijderen mislukt door een server- of databasefout." },
      { status: 500 }
    );
  }
}
