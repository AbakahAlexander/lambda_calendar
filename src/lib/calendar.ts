import { google } from "googleapis";
import type { ParsedEvent } from "./mistral";

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: ParsedEvent
) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const allDay = Boolean(event.allDay);

  const body = {
    summary: event.title,
    description: event.description || undefined,
    start: allDay
      ? { date: event.start.slice(0, 10) }
      : { dateTime: event.start },
    end: allDay
      ? { date: event.end.slice(0, 10) }
      : { dateTime: event.end },
  };

  const created = await calendar.events.insert({
    calendarId: "primary",
    requestBody: body,
  });

  return created.data;
}
