import Link from "next/link";

export const metadata = {
  title: "Terms of Service — A5",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-2 pb-16 text-left">
      <h1 className="font-display text-3xl tracking-tight text-foreground">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: [August 21, 2026]</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="font-display text-lg">Who this is for</h2>
          <p className="mt-2 text-muted">
            A5 is provided for use by players, coaches, and admins of this
            team only. An account may be created for you by a team admin, or
            you may sign up directly if the team allows it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Your account</h2>
          <p className="mt-2 text-muted">
            You&apos;re responsible for keeping your login credentials private and
            for the accuracy of the profile information you enter. Let a team
            admin know if you believe your account has been accessed without
            your permission.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Check-in and attendance</h2>
          <p className="mt-2 text-muted">
            Checking in marks you present for that session. A check-in may be
            flagged for a coach/admin to review if it looks unusually far
            from the training venue, or if a session was joined for less
            than the minimum required time. Submitting a check-in you know to
            be inaccurate is a violation of these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Uploads</h2>
          <p className="mt-2 text-muted">
            Don&apos;t upload anything you don&apos;t have the right to share, anything
            that violates someone else&apos;s privacy, or anything abusive,
            unlawful, or unrelated to the team. Admins may remove uploaded
            content that violates this.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Availability</h2>
          <p className="mt-2 text-muted">
            This app is provided as-is for team use. We&apos;ll do our best to
            keep it running, but we don&apos;t guarantee uninterrupted access, and
            the app isn&apos;t a substitute for direct communication with your
            coach for anything time-sensitive.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Changes</h2>
          <p className="mt-2 text-muted">
            These terms may be updated as the app changes. Continuing to use
            the app after an update means you accept the current version.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about these terms: [team@a5ventures.com]
          </p>
        </section>
      </div>

      <p className="mt-10 text-sm text-muted">
        <Link className="font-semibold text-foreground" href="/login">
          Back to login
        </Link>
      </p>
    </div>
  );
}
