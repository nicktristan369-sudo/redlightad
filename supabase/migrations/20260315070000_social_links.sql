-- Social links JSONB column on listings
-- Format: { "snapchat": { "url": "...", "locked": true, "price_coins": 50 }, ... }
alter table public.listings
  add column if not exists social_links jsonb default '{}';

-- Add missing platform columns (instagram, onlyfans, twitter_x)
alter table public.listings
  add column if not exists instagram text,
  add column if not exists onlyfans text,
  add column if not exists twitter_x text;

-- Track which buyers have unlocked which social links
create table if not exists public.social_link_unlocks (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid not null references auth.users(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  platform    text not null,  -- 'snapchat' | 'instagram' | 'onlyfans' | 'telegram' | 'whatsapp' | 'twitter_x'
  coins_paid  integer not null default 0,
  created_at  timestamptz default now(),
  unique (buyer_id, listing_id, platform)
);

-- RLS
alter table public.social_link_unlocks enable row level security;

create policy "Users can view own unlocks"
  on public.social_link_unlocks for select
  using (auth.uid() = buyer_id);

create policy "Users can insert own unlocks"
  on public.social_link_unlocks for insert
  with check (auth.uid() = buyer_id);

-- RPC: unlock a social link (deduct coins, credit seller, record unlock)
create or replace function public.unlock_social_link(
  p_listing_id  uuid,
  p_platform    text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_link       jsonb;
  v_price      integer;
  v_wallet     public.wallets%rowtype;
  v_seller_id  uuid;
  v_commission integer;
  v_seller_amt integer;
  v_listing    public.listings%rowtype;
begin
  -- Fetch listing
  select * into v_listing from public.listings
  where id = p_listing_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Listing not found');
  end if;

  v_seller_id := v_listing.user_id;

  -- Get link config from social_links JSON
  v_link := coalesce(v_listing.social_links, '{}') -> p_platform;

  if v_link is null or (v_link->>'locked')::boolean is not true then
    return jsonb_build_object('success', false, 'error', 'Link is not locked');
  end if;

  v_price := coalesce((v_link->>'price_coins')::integer, 0);

  if v_price <= 0 then
    return jsonb_build_object('success', false, 'error', 'Invalid price');
  end if;

  -- Already unlocked?
  if exists (
    select 1 from public.social_link_unlocks
    where buyer_id = auth.uid() and listing_id = p_listing_id and platform = p_platform
  ) then
    return jsonb_build_object('success', false, 'error', 'Already unlocked');
  end if;

  -- Check wallet
  select * into v_wallet from public.wallets
  where user_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Wallet not found');
  end if;

  if v_wallet.balance < v_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient coins');
  end if;

  -- 19% commission
  v_commission := round(v_price * 0.19);
  v_seller_amt := v_price - v_commission;

  -- Deduct from buyer
  update public.wallets set balance = balance - v_price
  where user_id = auth.uid();

  insert into public.coin_transactions (user_id, amount, type, description)
  values (auth.uid(), -v_price, 'spent',
          'Social link unlock: ' || p_platform || ' on listing ' || p_listing_id);

  -- Credit seller
  insert into public.wallets (user_id, balance)
  values (v_seller_id, v_seller_amt)
  on conflict (user_id) do update
  set balance = public.wallets.balance + v_seller_amt;

  insert into public.coin_transactions (user_id, amount, type, description)
  values (v_seller_id, v_seller_amt, 'earned',
          'Social link unlock (after 19% fee): ' || p_platform);

  -- Record unlock
  insert into public.social_link_unlocks (buyer_id, listing_id, platform, coins_paid)
  values (auth.uid(), p_listing_id, p_platform, v_price);

  -- Return the URL
  return jsonb_build_object(
    'success', true,
    'url', v_link->>'url',
    'platform', p_platform
  );
end;
$$;
