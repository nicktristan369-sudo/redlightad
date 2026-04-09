-- Tip menu table
create table if not exists public.cam_tip_menu (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade,
  action text not null,
  rc_amount integer not null,
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table public.cam_tip_menu enable row level security;
create policy "Anyone can read tip menu" on public.cam_tip_menu for select using (true);
create policy "Listing owner can manage tip menu" on public.cam_tip_menu for all using (
  auth.uid() = (select user_id from public.listings where id = listing_id)
);

-- Goal columns on listings
alter table public.listings
  add column if not exists cam_goal_title text,
  add column if not exists cam_goal_target integer default 0,
  add column if not exists cam_goal_current integer default 0,
  add column if not exists cam_goal_active boolean default false;

-- Notify-when-live table
create table if not exists public.cam_notify (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);
alter table public.cam_notify enable row level security;
create policy "Users manage own cam notifications" on public.cam_notify for all using (auth.uid() = user_id);
