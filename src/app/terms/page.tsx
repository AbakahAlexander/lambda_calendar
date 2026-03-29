import Link from "next/link";

export const metadata = {
  title: "Terms of Service · Lambda Calendar",
  description: "Terms of use for Lambda Calendar",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-zinc-300">
      <Link
        href="/"
        className="text-sm text-indigo-400 hover:text-indigo-300"
      >
        ← Back to app
      </Link>
      <h1 className="mt-8 text-2xl font-semibold text-zinc-100">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: March 28, 2026</p>

      <section className="mt-10 space-y-4 text-sm leading-relaxed">
        <p>
          By using Lambda Calendar, you agree to use the service only for lawful
          purposes and in line with Google’s and Mistral’s applicable terms.
        </p>
        <p>
          The service is provided “as is” without warranties. You are
          responsible for the content you submit and for reviewing events
          created in your calendar.
        </p>
        <p>
          We may change or discontinue the service at any time. Continued use
          after changes means you accept the updated terms.
        </p>
        <p className="pt-4 text-xs text-zinc-500">
          These terms are a minimal placeholder. Have them reviewed if you need
          legally binding documents.
        </p>
      </section>
    </div>
  );
}
