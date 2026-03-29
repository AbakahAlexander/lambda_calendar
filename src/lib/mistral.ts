import { Mistral } from "@mistralai/mistralai";

/** One row on the calendar: single meeting or one recurring series. */
export type ParsedCalendarEvent = {
  title: string;
  description?: string;
  /** Local wall time, no Z offset, e.g. 2026-03-31T10:30:00 */
  startDateTime: string;
  endDateTime: string;
  /** Google Calendar RRULE body after "RRULE:" — omit for a one-off event. */
  rrule?: string;
  /** Google Calendar palette 1–11; use distinct values per course when asked. */
  colorId?: string;
  allDay?: boolean;
};

const SYSTEM_PROMPT = `You are a calendar assistant. Convert the user's text into structured calendar data.

Output ONE JSON object only (no markdown), with this exact shape:
{ "events": [ ... ] }

Each element of "events" is one Google Calendar event or recurring series:
- "title" (string, required)
- "description" (string, optional)
- "startDateTime" (string, required): first occurrence start, LOCAL wall time in the user's timezone, format "YYYY-MM-DDTHH:mm:ss" with NO "Z" and NO offset.
- "endDateTime" (string, required): first occurrence end, same format as startDateTime.
- "rrule" (string, optional): ONLY the part AFTER "RRULE:" for recurring meetings. Use RFC 5545. Example body: FREQ=WEEKLY;BYDAY=TU,TH;UNTIL=20260606T075959Z
  - UNTIL must be UTC with Z suffix, set to just after the last day of the term the user gave.
  - Omit "rrule" entirely for a single one-time event.
- "colorId" (string, optional): "1" through "11". When the user asks for different colours per course, assign a different colorId per course (reuse the same colorId for all sections of the same course).
- "allDay" (boolean, optional): only for all-day events.

Rules:
- If the user lists a class schedule with multiple courses, output MULTIPLE events (one recurring series per distinct weekly pattern; if one course meets on different days/times, use separate events with the same title prefix and same colorId).
- Infer obvious typos (e.g. 9:9:55 → 09:00–09:55). If a time says PM but clearly conflicts with another class at the same slot, prefer AM for university schedules.
- Use the term start/end dates the user provides for the first occurrence and for UNTIL.
- If only one simple event is described, return an array of one object; omit "rrule" for one-off events.`;

function assistantText(content: string | unknown[] | null | undefined): string {
  if (typeof content === "string") return content;
  if (!content || !Array.isArray(content)) return "";
  return content
    .map((chunk) =>
      typeof chunk === "object" && chunk !== null && "text" in chunk
        ? String((chunk as { text?: string }).text ?? "")
        : ""
    )
    .join("");
}

/** First non-empty string among keys (models often use start/end instead of startDateTime/endDateTime). */
function firstStringField(
  obj: Record<string, unknown>,
  keys: string[]
): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickTitle(obj: Record<string, unknown>): string {
  const raw = firstStringField(obj, ["title", "summary", "name"]);
  return raw;
}

function pickColorId(obj: Record<string, unknown>): string | undefined {
  const c = obj.colorId;
  if (typeof c === "string" && c.trim()) return c.trim();
  if (typeof c === "number" && c >= 1 && c <= 11) return String(Math.floor(c));
  return undefined;
}

/** Normalize to YYYY-MM-DDTHH:mm:ss (no zone); pad seconds if missing. */
function normalizeLocalIso(s: string): string {
  const t = s.trim();
  if (!t) return "";
  const noZ =
    t.length > 1 && t.endsWith("Z") && t.includes("T") ? t.slice(0, -1) : t;
  const m = noZ.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) return t.slice(0, 19);
  const [, head, sec] = m;
  const full = sec ? `${head}:${sec}` : `${head}:00`;
  return full.slice(0, 19);
}

function parseEventsFromJson(parsed: Record<string, unknown>): ParsedCalendarEvent[] {
  if (Array.isArray(parsed.events)) {
    const out: ParsedCalendarEvent[] = [];
    for (const item of parsed.events) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      const title = pickTitle(e);
      const startDateTime = normalizeLocalIso(
        firstStringField(e, [
          "startDateTime",
          "start",
          "startTime",
          "start_time",
        ])
      );
      const endDateTime = normalizeLocalIso(
        firstStringField(e, ["endDateTime", "end", "endTime", "end_time"])
      );
      if (!title || !startDateTime || !endDateTime) continue;
      const ev: ParsedCalendarEvent = {
        title,
        description:
          typeof e.description === "string" ? e.description : undefined,
        startDateTime,
        endDateTime,
        rrule: typeof e.rrule === "string" ? e.rrule.trim() : undefined,
        colorId: pickColorId(e),
        allDay: typeof e.allDay === "boolean" ? e.allDay : undefined,
      };
      if (!ev.rrule) delete ev.rrule;
      if (!ev.colorId) delete ev.colorId;
      out.push(ev);
    }
    return out;
  }

  // Legacy: single event { title, start, end, allDay? }
  const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
  const start =
    typeof parsed.start === "string" ? normalizeLocalIso(parsed.start) : "";
  const end = typeof parsed.end === "string" ? normalizeLocalIso(parsed.end) : "";
  if (title && start && end) {
    return [
      {
        title,
        description:
          typeof parsed.description === "string"
            ? parsed.description
            : undefined,
        startDateTime: start,
        endDateTime: end,
        allDay: typeof parsed.allDay === "boolean" ? parsed.allDay : undefined,
      },
    ];
  }

  return [];
}

export async function parseNaturalLanguageSchedule(
  apiKey: string,
  userText: string,
  timezone: string,
  nowIso: string
): Promise<ParsedCalendarEvent[]> {
  const client = new Mistral({ apiKey });

  const res = await client.chat.complete({
    model: "mistral-small-latest",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `User timezone (IANA): ${timezone}\nCurrent time (ISO): ${nowIso}\n\nEvent text:\n${userText}`,
      },
    ],
    temperature: 0.15,
    maxTokens: 8192,
    responseFormat: { type: "json_object" },
  });

  const text = assistantText(res.choices?.[0]?.message?.content).trim();
  if (!text) {
    throw new Error("Empty response from AI");
  }

  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error("AI did not return valid JSON");
  }

  const events = parseEventsFromJson(raw);
  if (events.length === 0) {
    throw new Error(
      "AI returned incomplete event fields (each item needs title, start, and end times). Try again, or split into one course at a time."
    );
  }

  return events;
}
