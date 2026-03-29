import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";
import type { ParsedCalendarEvent } from "./mistral";

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: ParsedCalendarEvent,
  timeZone: string
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const allDay = Boolean(event.allDay);

  const body: Record<string, unknown> = {
    summary: event.title,
    description: event.description || undefined,
  };

  if (allDay) {
    body.start = { date: event.startDateTime.slice(0, 10) };
    body.end = { date: event.endDateTime.slice(0, 10) };
  } else {
    body.start = { dateTime: event.startDateTime, timeZone };
    body.end = { dateTime: event.endDateTime, timeZone };
  }

  if (event.rrule && event.rrule.length > 0) {
    const rule = event.rrule.startsWith("RRULE:")
      ? event.rrule
      : `RRULE:${event.rrule}`;
    body.recurrence = [rule];
  }

  if (event.colorId && /^([1-9]|1[01])$/.test(event.colorId)) {
    body.colorId = event.colorId;
  }

  const created = await calendar.events.insert({
    calendarId: "primary",
    requestBody: body as calendar_v3.Schema$Event,
  });

  return created.data;
}
