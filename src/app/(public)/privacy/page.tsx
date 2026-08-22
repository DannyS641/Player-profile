import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — A5",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-2 pb-16 text-left">
      <h1 className="font-display text-3xl tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted">Last updated: [August 21, 2026]</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="font-display text-lg">What this app is for</h2>
          <p className="mt-2 text-muted">
            A5 is a private roster app for one team. It is not a public
            social network — only players on the roster and team
            admins/coaches can sign in, and only people on this team can see
            player information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Information we collect</h2>
          <p className="mt-2 text-muted">When you create a profile, we store:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Name, email, phone number</li>
            <li>Position, jersey number, height, weight, dominant hand, wingspan</li>
            <li>A profile photo you choose to upload</li>
            <li>Colleges of interest and social media handles you choose to add</li>
            <li>Documents, training clips, and essay submissions you upload</li>
            <li>Attendance records: session dates, Zoom join/leave times, and check-in status</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-lg">Location — check-in only, never tracked</h2>
          <p className="mt-2 text-muted">
            When you tap the check-in button, the app asks your device for
            your location one time, at that moment, to confirm you&apos;re near
            training. That single reading (or a note that none was
            available) is stored with that day&apos;s attendance record. The app
            never requests your location at any other time, does not run in
            the background, and does not build a history of your
            whereabouts.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Who can see what</h2>
          <p className="mt-2 text-muted">
            You can see your own profile, attendance, documents, and
            reminders. Team admins/coaches can see roster profiles,
            attendance records (including check-in location, used only to
            flag check-ins that look far from the venue for manual review),
            and uploaded documents and clips. Personal reminders you add to
            the calendar are private — only you can see those, not admins.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Where data is stored</h2>
          <p className="mt-2 text-muted">
            Data is stored with Supabase (database and file storage) and
            attendance can be recorded via Zoom&apos;s meeting data when you join
            a session. We don&apos;t sell data, and we don&apos;t use it for
            advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Players under 18</h2>
          <p className="mt-2 text-muted">
            If you&apos;re creating a profile for a player who is a minor, a
            parent or guardian should review this policy and the account
            should be set up with their knowledge. Reach out using the
            contact below if you&apos;d like to review, correct, or delete a
            minor&apos;s information.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Your choices</h2>
          <p className="mt-2 text-muted">
            You can edit or remove most profile details yourself from
            Settings at any time. To request a full export or deletion of
            your data, contact the team using the details below.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg">Contact</h2>
          <p className="mt-2 text-muted">
            Questions about this policy or your data: [team@a5ventures.com]
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
