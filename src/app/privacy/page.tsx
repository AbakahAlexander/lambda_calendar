import Link from "next/link";

export const metadata = {
  title: "Privacy Policy · Lambda Calendar",
  description: "How Lambda Calendar handles your data",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-zinc-300">
      <Link
        href="/"
        className="text-sm text-indigo-400 hover:text-indigo-300"
      >
        ← Back to app
      </Link>
      <h1 className="mt-8 text-2xl font-semibold text-zinc-100">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: March 28, 2026</p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <h2 className="font-medium text-zinc-200">What this service is</h2>
        <p>
          Lambda Calendar (“we”, “the service”) lets you describe events in
          natural language and creates corresponding events in your Google
          Calendar. A third-party AI (Mistral) is used only to turn your text
          into structured event details (title, time, etc.).
        </p>

        <h2 className="pt-4 font-medium text-zinc-200">Google account data</h2>
        <p>
          When you sign in with Google, we use Google OAuth to obtain
          permission to create calendar events you request. We request access
          only to what is needed for that purpose (see the permissions shown
          on Google’s consent screen). We do not sell your Google data.
        </p>

        <h2 className="pt-4 font-medium text-zinc-200">What we send to AI</h2>
        <p>
          The text you type in the app is sent to Mistral’s API so it can be
          parsed into event fields. Do not enter secrets or highly sensitive
          personal data in the text box.
        </p>

        <h2 className="pt-4 font-medium text-zinc-200">Retention</h2>
        <p>
          This application is designed to process requests in real time. Server
          logs may be kept by your hosting provider under their policies.
        </p>

        <h2 className="pt-4 font-medium text-zinc-200">Contact</h2>
        <p>
          For privacy questions, use the support email shown on Google’s OAuth
          consent screen for this app.
        </p>

        <p className="pt-6 text-xs text-zinc-500">
          This text is a practical summary for OAuth verification. Adjust it to
          match your deployment, logging, and legal needs.
        </p>
      </section>
    </div>
  );
}
