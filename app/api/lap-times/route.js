import { NextResponse } from "next/server";
import { setAppSetting } from "@/db/queries/app-settings";
import { createLapTime } from "@/db/queries/lap-times";
import { hasValidAdminSession } from "@/lib/auth";
import { adminText } from "@/lib/admin-text";
import { isLapTimeInAllowedRange, parseLapTimeToMs } from "@/lib/time";

function requireText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseBoolean(value) {
  return value === true;
}

export async function POST(request) {
  try {
    if (!hasValidAdminSession(request)) {
      return NextResponse.json({ error: adminText.api.unauthorized }, { status: 401 });
    }

    const body = await request.json();

    const driverName = requireText(body?.driverName);
    const trackName = requireText(body?.trackName);
    const lapTimeDisplay = requireText(body?.lapTime);
    const sessionDate = requireText(body?.sessionDate);
    const setup = requireText(body?.setup) || "Balanced";
    const isWet = parseBoolean(body?.isWet);
    const seat = requireText(body?.seat) || requireText(body?.selectedSeat);
    const carName = "F1";

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

    const result = await createLapTime({
      driverName,
      trackName,
      carName,
      lapTimeDisplay,
      lapTimeMs,
      sessionDate,
      notes: null,
      isWet,
      setup,
      seat
    });

    if (result.action === "skipped") {
      return NextResponse.json(
        {
          data: result.data,
          action: result.action,
          message: adminText.api.lapTimeSkipped,
          isCircuitRecord: false
        },
        { status: 200 }
      );
    }

    await setAppSetting("public_active_circuit", trackName);

    if (result.action === "replaced") {
      return NextResponse.json(
        {
          data: result.data,
          action: result.action,
          message: result.isCircuitRecord ? adminText.api.lapTimeRecord : adminText.api.lapTimeReplaced,
          isCircuitRecord: result.isCircuitRecord
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        data: result.data,
        action: result.action,
        message: result.isCircuitRecord ? adminText.api.lapTimeRecord : adminText.api.lapTimeSaved,
        isCircuitRecord: result.isCircuitRecord
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create lap time", error);

    return NextResponse.json(
      { error: adminText.api.lapTimeServerError },
      { status: 500 }
    );
  }
}
