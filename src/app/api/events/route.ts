import { auth } from "@/auth";
import { createGoogleCalendarEvent } from "@/lib/calendar";
import { parseNaturalLanguageEvent } from "@/lib/mistral";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to create calendar events." },
      { status: 401 }
    );
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  if (!mistralKey) {
    return NextResponse.json(
      { error: "Server missing MISTRAL_API_KEY." },
      { status: 500 }
    );
  }

  let body: { text?: string; timezone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  const timezone =
    typeof body.timezone === "string" && body.timezone.length > 0
      ? body.timezone
      : "UTC";

  if (!text) {
    return NextResponse.json(
      { error: "Provide non-empty text describing the event." },
      { status: 400 }
    );
  }

  try {
    const nowIso = new Date().toISOString();
    const parsed = await parseNaturalLanguageEvent(
      mistralKey,
      text,
      timezone,
      nowIso
    );
    const created = await createGoogleCalendarEvent(
      session.accessToken,
      parsed
    );
    return NextResponse.json({
      ok: true,
      event: parsed,
      htmlLink: created.htmlLink ?? null,
      id: created.id ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
