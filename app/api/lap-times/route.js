import { NextResponse } from "next/server";
import { setAppSetting } from "@/db/queries/app-settings";
import { createLapTime } from "@/db/queries/lap-times";
import { hasValidAdminSession } from "@/lib/auth";
import { adminText } from "@/lib/admin-text";
import { parseLapTimeToMs } from "@/lib/time";

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

    const driverName = requireText(body?.driverName);
    const trackName = requireText(body?.trackName);
    const lapTimeDisplay = requireText(body?.lapTime);
    const sessionDate = requireText(body?.sessionDate);
    const carName = "F1";

    if (!driverName || !trackName || !lapTimeDisplay || !sessionDate) {
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

    const result = await createLapTime({
      driverName,
      trackName,
      carName,
      lapTimeDisplay,
      lapTimeMs,
      sessionDate,
      notes: null
    });

    if (result.action === "skipped") {
      return NextResponse.json(
        {
          data: result.data,
          action: result.action,
          message: adminText.api.lapTimeSkipped
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
          message: adminText.api.lapTimeReplaced
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        data: result.data,
        action: result.action,
        message: adminText.api.lapTimeSaved
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
