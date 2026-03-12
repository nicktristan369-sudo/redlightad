create table if not exists public.listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  gender text not null,
  age integer not null,
  location text not null,
  about text,
  services text[] default '{}',
  languages text[] default '{}',
  rate_1hour text,
  rate_2hours text,
  rate_overnight text,
  rate_weekend text,
  phone text,
  whatsapp text,
  telegram text,
  snapchat text,
  email text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.listings enable row level security;

create policy "Users can insert own listings" on public.listings
  for insert with check (auth.uid() = user_id);

create policy "Users can view own listings" on public.listings
  for select using (auth.uid() = user_id);

create policy "Users can update own listings" on public.listings
  for update using (auth.uid() = user_id);

create policy "Public listings are visible to all" on public.listings
  for select using (status = 'active');
