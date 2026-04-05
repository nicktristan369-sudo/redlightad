-- Tilføj boost kolonner til listings
alter table public.listings
  add column if not exists boost_expires_at timestamptz,
  add column if not exists boost_purchased_at timestamptz;

-- Tilføj premium_until hvis det ikke allerede er der (burde eksistere)
alter table public.listings
  add column if not exists premium_until timestamptz;

-- Boost history tabel
create table if not exists public.boost_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  listing_id uuid references public.listings(id) on delete cascade,
  package_id text not null,
  coins_spent integer not null,
  boost_type text not null check (boost_type in ('premium', 'push_to_top')),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.boost_purchases enable row level security;
create policy "Users view own boost_purchases" on public.boost_purchases
  for select using (auth.uid() = user_id);
create policy "Service role insert boost_purchases" on public.boost_purchases
  for insert with check (true);

-- add_red_coins function hvis den ikke eksisterer
create or replace function public.add_red_coins(p_user_id uuid, p_coins integer)
returns void language plpgsql security definer as $$
begin
  update public.wallets set balance = balance + p_coins where user_id = p_user_id;
  if not found then
    insert into public.wallets (user_id, balance) values (p_user_id, p_coins);
  end if;
end;
$$;

-- deduct_red_coins function
create or replace function public.deduct_red_coins(p_user_id uuid, p_coins integer)
returns boolean language plpgsql security definer as $$
declare
  current_balance integer;
begin
  select balance into current_balance from public.wallets where user_id = p_user_id;
  if current_balance is null or current_balance < p_coins then
    return false;
  end if;
  update public.wallets set balance = balance - p_coins where user_id = p_user_id;
  return true;
end;
$$;
