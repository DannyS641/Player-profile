# Players Profile

Player profile and attendance app built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Setup

1. Copy `.env.local.example` to `.env.local` and set your Supabase keys.
2. Apply the schema in `supabase/schema.sql` inside the Supabase SQL editor.
3. Create Storage buckets:
   - `avatars` (public) for profile photos
   - `documents` (private) for transcripts
   - `education` (private) for essays
4. Make your user an admin after signup:

```sql
update profiles set role = 'admin' where id = 'YOUR_USER_UUID';
```

5. Optional: set the shared Zoom link for all players:

```sql
update app_settings set zoom_link = 'https://zoom.us/...' where id = 1;
```

## Zoom webhook setup (verified attendance)

1. Create a Zoom **Server-to-Server OAuth** app.
2. Enable webhook events:
   - `meeting.participant_joined`
   - `meeting.participant_left`
3. Deploy the Supabase Edge Function in `supabase/functions/zoom-webhook`.
4. Set env vars for the function:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ZOOM_WEBHOOK_SECRET`
5. In admin, set:
   - `meeting_id = 9154499341`
   - `session_time = 04:00`
   - `session_tz = Africa/Lagos`
   - `min_minutes = 10`

## Auto-fill education titles

Deploy the Edge Function:

```bash
supabase functions deploy title-fetcher
```

It uses:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Then in **Admin → Education resources**, paste a link and click **Auto-fill title**.

## Dev

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` landing page
- `/login` and `/signup` auth
- `/onboarding` profile setup
- `/profile` profile + Zoom check-in
- `/attendance` attendance history
- `/settings` password update
# Player-profile
