import Link from "next/link";

const features = [
  {
    title: "Player profiles",
    description: "Capture position, jersey, team, and contact details once.",
    animation: "animate-slide-left animate-delay-200",
  },
  {
    title: "Attendance on click",
    description: "When a player joins the Zoom link, they are marked present.",
    animation: "animate-slide-up animate-delay-300",
  },
  {
    title: "Fast onboarding",
    description: "New players fill a clean form and get to their profile fast.",
    animation: "animate-slide-right animate-delay-400",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center gap-10 pb-12 pt-8 text-center">
      <section className="mx-auto w-full max-w-3xl space-y-8 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted opacity-0 animate-slide-down">
          Team portal
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-4xl tracking-tight text-foreground opacity-0 animate-slide-left animate-delay-100 md:text-6xl">
            &quot;Great players are built one session at a time.&quot;
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted opacity-0 animate-slide-right animate-delay-200">
            Players sign in, update their profile, and join training with one
            click. Every Zoom join is recorded as attendance.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 opacity-0 animate-slide-up animate-delay-300">
          <Link
            href="/signup"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold transition hover:border-foreground"
          >
            I already have an account
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border border-line bg-card p-5 opacity-0 shadow-[0_12px_30px_-30px_rgba(11,27,43,0.9)] ${feature.animation}`}
            >
              <h3 className="font-display text-lg">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
