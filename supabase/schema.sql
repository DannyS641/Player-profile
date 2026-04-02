create extension if not exists "pgcrypto";

-- Core application schema. This section is safe to rerun.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text not null,
  position text,
  team text default 'Adrenale 5',
  jersey_number text,
  height text,
  weight text,
  dominant_hand text,
  wingspan text,
  phone text,
  photo_url text,
  instagram_url text,
  tiktok_url text,
  role text default 'player',
  status text default 'active',
  colleges_of_interest text,
  updated_at timestamptz default now()
);

create table if not exists app_settings (
  id int primary key default 1,
  zoom_link text,
  meeting_id text,
  session_time time default '04:00:00',
  session_tz text default 'Africa/Lagos',
  min_minutes int default 10,
  updated_at timestamptz default now()
);

insert into app_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists attendance_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id) on delete set null,
  participant_email text,
  meeting_id text,
  session_date date not null,
  joined_at timestamptz,
  left_at timestamptz,
  duration_minutes int,
  source text default 'zoom_webhook',
  raw_payload jsonb,
  updated_at timestamptz default now(),
  unique (meeting_id, participant_email, session_date)
);

create table if not exists attendance_overrides (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id) on delete cascade,
  session_date date not null,
  status text not null check (status in ('present', 'absent')),
  reason text,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now(),
  unique (player_id, session_date)
);

create table if not exists education_resources (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('film', 'youtube')),
  title text not null,
  url text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists weekly_schedule (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  period text not null check (period in ('morning', 'afternoon', 'evening')),
  title text not null,
  time text,
  venue text,
  notes text,
  sort_order int default 0
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles (id) on delete cascade,
  session_date date not null,
  checked_in_at timestamptz default now(),
  method text default 'zoom_link',
  unique (player_id, session_date)
);

alter table profiles enable row level security;
alter table attendance enable row level security;
alter table app_settings enable row level security;
alter table attendance_events enable row level security;
alter table attendance_overrides enable row level security;
alter table education_resources enable row level security;
alter table weekly_schedule enable row level security;

-- Storage bucket bootstrap for player videos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-dump',
  'media-dump',
  false,
  1073741824,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
)
on conflict (id) do nothing;

-- Helper for admin checks
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Profiles are viewable by owner" on profiles;
drop policy if exists "Profiles are insertable by owner" on profiles;
drop policy if exists "Profiles are updatable by owner" on profiles;
drop policy if exists "Attendance is viewable by owner" on attendance;
drop policy if exists "Attendance is insertable by owner" on attendance;
drop policy if exists "App settings are readable" on app_settings;
drop policy if exists "App settings are updatable by admin" on app_settings;
drop policy if exists "App settings are insertable by admin" on app_settings;
drop policy if exists "Attendance events are viewable by owner" on attendance_events;
drop policy if exists "Attendance events are insertable by admin" on attendance_events;
drop policy if exists "Attendance events are updatable by admin" on attendance_events;
drop policy if exists "Attendance overrides are viewable by owner" on attendance_overrides;
drop policy if exists "Attendance overrides are insertable by admin" on attendance_overrides;
drop policy if exists "Attendance overrides are updatable by admin" on attendance_overrides;
drop policy if exists "Attendance overrides are deletable by admin" on attendance_overrides;
drop policy if exists "Education resources are viewable" on education_resources;
drop policy if exists "Education resources are insertable by admin" on education_resources;
drop policy if exists "Education resources are updatable by admin" on education_resources;
drop policy if exists "Education resources are deletable by admin" on education_resources;
drop policy if exists "Weekly schedule is viewable" on weekly_schedule;
drop policy if exists "Weekly schedule is insertable by admin" on weekly_schedule;
drop policy if exists "Weekly schedule is updatable by admin" on weekly_schedule;
drop policy if exists "Weekly schedule is deletable by admin" on weekly_schedule;
drop policy if exists "Avatar images are public" on storage.objects;
drop policy if exists "Avatar uploads by owner" on storage.objects;
drop policy if exists "Avatar updates by owner" on storage.objects;
drop policy if exists "Avatar deletes by owner" on storage.objects;

create policy "Profiles are viewable by owner"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Profiles are insertable by owner"
  on profiles for insert
  with check (auth.uid() = id or public.is_admin());

create policy "Profiles are updatable by owner"
  on profiles for update
  using (
    auth.uid() = id
    or public.is_admin()
  )
  with check (
    public.is_admin()
    or (
      auth.uid() = id
      and role = 'player'
      and status = (select p.status from profiles p where p.id = profiles.id)
    )
  );

create policy "Attendance is viewable by owner"
  on attendance for select
  using (auth.uid() = player_id or public.is_admin());

create policy "Attendance is insertable by owner"
  on attendance for insert
  with check (auth.uid() = player_id or public.is_admin());

create policy "App settings are readable"
  on app_settings for select
  using (true);

create policy "App settings are updatable by admin"
  on app_settings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "App settings are insertable by admin"
  on app_settings for insert
  with check (public.is_admin());

create policy "Attendance events are viewable by owner"
  on attendance_events for select
  using (auth.uid() = player_id or public.is_admin());

create policy "Attendance events are insertable by admin"
  on attendance_events for insert
  with check (public.is_admin());

create policy "Attendance events are updatable by admin"
  on attendance_events for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Attendance overrides are viewable by owner"
  on attendance_overrides for select
  using (auth.uid() = player_id or public.is_admin());

create policy "Attendance overrides are insertable by admin"
  on attendance_overrides for insert
  with check (public.is_admin());

create policy "Attendance overrides are updatable by admin"
  on attendance_overrides for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Attendance overrides are deletable by admin"
  on attendance_overrides for delete
  using (public.is_admin());

create policy "Education resources are viewable"
  on education_resources for select
  using (true);

create policy "Education resources are insertable by admin"
  on education_resources for insert
  with check (public.is_admin());

create policy "Education resources are updatable by admin"
  on education_resources for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Education resources are deletable by admin"
  on education_resources for delete
  using (public.is_admin());

create policy "Weekly schedule is viewable"
  on weekly_schedule for select
  using (true);

create policy "Weekly schedule is insertable by admin"
  on weekly_schedule for insert
  with check (public.is_admin());

create policy "Weekly schedule is updatable by admin"
  on weekly_schedule for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Weekly schedule is deletable by admin"
  on weekly_schedule for delete
  using (public.is_admin());

-- Storage policies.
-- Do not run `alter table storage.objects enable row level security;`
-- here, because `storage.objects` is managed by Supabase and the SQL editor
-- role is not the table owner.

create policy "Avatar images are public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Avatar uploads by owner"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Avatar updates by owner"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() = owner)
  with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Avatar deletes by owner"
  on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "Documents viewable by owner" on storage.objects;
drop policy if exists "Documents uploads by owner" on storage.objects;
drop policy if exists "Documents updates by owner" on storage.objects;
drop policy if exists "Documents deletes by owner" on storage.objects;

create policy "Documents viewable by owner"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      auth.uid() = owner
      or public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy "Documents uploads by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Documents updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Documents deletes by owner"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Education uploads viewable by owner" on storage.objects;
drop policy if exists "Education uploads by owner" on storage.objects;
drop policy if exists "Education uploads updates by owner" on storage.objects;
drop policy if exists "Education uploads deletes by owner" on storage.objects;

create policy "Education uploads viewable by owner"
  on storage.objects for select
  using (
    bucket_id = 'education'
    and (
      auth.uid() = owner
      or public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy "Education uploads by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'education'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Education uploads updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'education'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'education'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Education uploads deletes by owner"
  on storage.objects for delete
  using (
    bucket_id = 'education'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Media dump viewable by owner" on storage.objects;
drop policy if exists "Media dump uploads by owner" on storage.objects;
drop policy if exists "Media dump updates by owner" on storage.objects;
drop policy if exists "Media dump deletes by owner" on storage.objects;

create policy "Media dump viewable by owner"
  on storage.objects for select
  using (
    bucket_id = 'media-dump'
    and (
      auth.uid() = owner
      or public.is_admin()
      or auth.uid()::text = (storage.foldername(name))[1]
    )
  );

create policy "Media dump uploads by owner"
  on storage.objects for insert
  with check (
    bucket_id = 'media-dump'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Media dump updates by owner"
  on storage.objects for update
  using (
    bucket_id = 'media-dump'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'media-dump'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Media dump deletes by owner"
  on storage.objects for delete
  using (
    bucket_id = 'media-dump'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
