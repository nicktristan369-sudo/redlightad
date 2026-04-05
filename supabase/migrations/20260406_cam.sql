-- RedLightCam: cam columns on listings
alter table public.listings add column if not exists cam_live boolean default false;
alter table public.listings add column if not exists cam_title text;
alter table public.listings add column if not exists cam_viewers integer default 0;
alter table public.listings add column if not exists cam_started_at timestamptz;
alter table public.listings add column if not exists cam_category text default 'public';
alter table public.listings add column if not exists cam_tokens_per_min integer default 20;

-- RedLightCam: chat messages
create table if not exists public.cam_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.listings(id),
  user_id uuid references auth.users(id),
  username text not null,
  message text not null,
  is_tip boolean default false,
  tip_amount integer,
  created_at timestamptz default now()
);

alter table public.cam_messages enable row level security;

create policy "Anyone can read cam messages" on public.cam_messages
  for select using (true);

create policy "Auth users can insert" on public.cam_messages
  for insert with check (auth.uid() = user_id);
