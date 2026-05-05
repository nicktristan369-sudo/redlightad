-- VOD / Stream Replay recordings table
create table if not exists public.cam_recordings (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text,
  cloudinary_url text not null,
  cloudinary_public_id text,
  duration_seconds integer default 0,
  file_size_bytes bigint default 0,
  thumbnail_url text,
  tip_count integer default 0,
  tip_total integer default 0,
  visible boolean default true,
  created_at timestamptz default now()
);

alter table public.cam_recordings enable row level security;

-- Anyone can view visible recordings
create policy "Anyone can view visible recordings" on public.cam_recordings
  for select using (visible = true);

-- Owner can manage their recordings
create policy "Owner can manage recordings" on public.cam_recordings
  for all using (auth.uid() = user_id);

-- Index for listing lookups
create index if not exists cam_recordings_listing_id_idx on public.cam_recordings(listing_id);
create index if not exists cam_recordings_user_id_idx on public.cam_recordings(user_id);
