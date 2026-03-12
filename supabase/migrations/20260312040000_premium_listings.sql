alter table public.listings
  add column if not exists premium_tier text check (premium_tier in ('basic', 'featured', 'vip')),
  add column if not exists premium_until timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Orders table for payment history
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete set null,
  stripe_session_id text unique,
  stripe_subscription_id text,
  tier text not null,
  amount integer not null,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.orders enable row level security;

create policy "Users view own orders" on public.orders
  for select using (auth.uid() = user_id);

create policy "Service role insert orders" on public.orders
  for insert with check (true);
