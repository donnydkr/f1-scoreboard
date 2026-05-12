import { NextResponse } from "next/server";
import { deleteLapTimeById, updateLapTimeById } from "@/db/queries/lap-times";
import { adminText } from "@/lib/admin-text";
import { getAmsterdamDateString, isLapTimeInAllowedRange, parseLapTimeToMs } from "@/lib/time";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseBoolean(value) {
  return value === true;
}

function getId(context) {
  const params = context?.params;
  return Promise.resolve(params).then((resolvedParams) => Number(resolvedParams?.id));
}

export async function PATCH(request, context) {
  try {
    const id = await getId(context);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: adminText.api.lapTimeInvalidId }, { status: 400 });
    }

    const body = await request.json();
    const driverName = requireText(body?.driverName);
    const trackName = requireText(body?.trackName);
    const lapTimeDisplay = requireText(body?.lapTime);
    const sessionDate = requireText(body?.sessionDate) || getAmsterdamDateString();
    const setup = requireText(body?.setup) || "Balanced";
    const isWet = parseBoolean(body?.isWet);
    const seat = requireText(body?.seat) || requireText(body?.selectedSeat);
    const carName = requireText(body?.carName) || "F1";
    const notes = requireText(body?.notes) || null;

    if (!driverName || !trackName || !lapTimeDisplay || !sessionDate || !seat) {
      return NextResponse.json(
        { error: adminText.api.lapTimeMissingFields },
        { status: 400 }
      );
    }

    const lapTimeMs = parseLapTimeToMs(lapTimeDisplay);
    if (!lapTimeMs) {
      return NextResponse.json(
        { error: adminText.api.lapTimeFormatError },
        { status: 400 }
      );
    }

    if (!isLapTimeInAllowedRange(lapTimeMs)) {
      return NextResponse.json(
        { error: adminText.api.lapTimeRangeError },
        { status: 400 }
      );
    }

    const updated = await updateLapTimeById(id, {
      driverName,
      trackName,
      carName,
      lapTimeMs,
      lapTimeDisplay,
      setup,
      isWet,
      sessionDate,
      notes,
      seat
    });

    if (!updated) {
      return NextResponse.json({ error: adminText.api.lapTimeNotFound }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update lap time", error);

    return NextResponse.json(
      { error: adminText.api.lapTimeUpdateServerError },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const id = await getId(context);

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
