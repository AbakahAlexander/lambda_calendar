import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500">
      <Link href="/privacy" className="text-zinc-400 hover:text-zinc-300">
        Privacy
      </Link>
      <span className="mx-2 text-zinc-600">·</span>
      <Link href="/terms" className="text-zinc-400 hover:text-zinc-300">
        Terms
      </Link>
    </footer>
  );
}
