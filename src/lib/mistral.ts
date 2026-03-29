import { Mistral } from "@mistralai/mistralai";

export type ParsedEvent = {
  title: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
};

const SYSTEM_PROMPT = `You are a calendar assistant. Parse the user's message into a single calendar event.
Rules:
- Infer date and time from natural language. If no year is given, use the year from "Current time" below.
- If duration is missing, default to 1 hour for timed events.
- For timed events: use ISO 8601 with correct offset for the user's timezone (e.g. 2026-03-28T15:00:00-04:00).
- For all-day events: set allDay to true; use YYYY-MM-DD only for start and end. Google Calendar uses an exclusive end date: for a single day D, start is D and end is the next calendar day.
- Respond with JSON only (no markdown), keys: title, description (string, may be empty), start, end, allDay (boolean).`;

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

export async function parseNaturalLanguageEvent(
  apiKey: string,
  userText: string,
  timezone: string,
  nowIso: string
): Promise<ParsedEvent> {
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
    temperature: 0.2,
    responseFormat: { type: "json_object" },
  });

  const text = assistantText(res.choices?.[0]?.message?.content).trim();
  if (!text) {
    throw new Error("Empty response from AI");
  }

  const parsed = JSON.parse(text) as ParsedEvent;
  if (!parsed.title || !parsed.start || !parsed.end) {
    throw new Error("AI returned incomplete event fields");
  }
  return parsed;
}
