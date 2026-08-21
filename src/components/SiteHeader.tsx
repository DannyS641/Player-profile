import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-3xl border border-line bg-white px-6 py-5 shadow-[0_12px_28px_-24px_rgba(11,27,43,0.55)] opacity-0 animate-slide-down">
      <Link href="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="A5" className="h-8 w-8" />
        A5
      </Link>
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold sm:gap-3 sm:text-sm">
        <Link
          href="/login"
          className="rounded-full border border-line px-4 py-2 transition hover:border-foreground"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-accent px-4 py-2 text-white transition hover:bg-[#08150e]"
        >
          Sign up
        </Link>
      </nav>
    </header>
  );
}
