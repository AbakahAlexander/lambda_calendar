"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  async function submit() {
    setMessage(null);
    setLoading(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        htmlLink?: string | null;
        count?: number;
        events?: Array<{ title: string; htmlLink?: string | null }>;
      };
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Request failed" });
        return;
      }
      const n = data.count ?? data.events?.length ?? 1;
      const link = data.htmlLink ?? data.events?.[0]?.htmlLink;
      setMessage({
        type: "ok",
        text:
          n > 1
            ? `Created ${n} calendar events.`
            : link
              ? `Created “${data.events?.[0]?.title ?? "event"}”. Open in Calendar.`
              : `Created “${data.events?.[0]?.title ?? "event"}”.`,
      });
      if (link) {
        window.open(link, "_blank", "noopener,noreferrer");
      }
      setText("");
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-16">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Lambda Calendar
        </h1>
        <p className="mt-2 text-zinc-400">
          Describe an event in plain language; we parse it with Mistral and add
          it to your Google Calendar.
        </p>
      </header>

      {status === "loading" ? (
        <p className="text-zinc-500">Loading…</p>
      ) : !session ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          <p className="mb-6 text-zinc-300">
            Connect your Google account so we can create events. You do not paste
            a calendar link or personal API key—Google sign-in uses OAuth, the
            same secure flow used by many apps.
          </p>
          <button
            type="button"
            onClick={() => signIn("google")}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-4 text-sm text-zinc-500">
            <span className="truncate">
              Signed in as {session.user?.email ?? session.user?.name}
            </span>
            <button
              type="button"
              onClick={() => signOut()}
              className="shrink-0 text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
            >
              Sign out
            </button>
          </div>

          <label className="mb-2 block text-sm font-medium text-zinc-300">
            What should we schedule?
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder='e.g. "Team standup tomorrow at 9am for 30 minutes" or "Dentist next Friday 2pm"'
            className="mb-4 w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            disabled={loading || !text.trim()}
            onClick={submit}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition enabled:hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Creating…" : "Add to Google Calendar"}
          </button>

          {message && (
            <p
              className={`mt-6 text-sm ${
                message.type === "ok" ? "text-emerald-400" : "text-red-400"
              }`}
              role="status"
            >
              {message.text}
            </p>
          )}
        </>
      )}
    </main>
  );
}
