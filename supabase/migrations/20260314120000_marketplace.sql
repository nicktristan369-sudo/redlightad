-- Marketplace items
create table if not exists public.marketplace_items (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid references auth.users on delete cascade,
  title            text not null,
  description      text,
  category         text check (category in ('photos','videos','camshow','underwear','toy','other')),
  coin_price       integer not null check (coin_price > 0),
  thumbnail_url    text,
  preview_url      text,
  full_content_urls text[],
  content_type     text check (content_type in ('image','video','physical')),
  stock            integer,           -- NULL = unlimited
  status           text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at       timestamptz not null default now(),
  purchase_count   integer not null default 0
);

-- Marketplace purchases
create table if not exists public.marketplace_purchases (
  id          uuid primary key default gen_random_uuid(),
  buyer_id    uuid references auth.users on delete cascade,
  item_id     uuid references public.marketplace_items on delete cascade,
  coins_paid  integer not null,
  created_at  timestamptz not null default now(),
  unique (buyer_id, item_id)
);

-- Indexes
create index if not exists idx_marketplace_items_status   on public.marketplace_items (status);
create index if not exists idx_marketplace_items_category on public.marketplace_items (category);
create index if not exists idx_marketplace_items_seller   on public.marketplace_items (seller_id);
create index if not exists idx_marketplace_purchases_buyer on public.marketplace_purchases (buyer_id);
create index if not exists idx_marketplace_purchases_item  on public.marketplace_purchases (item_id);

-- RLS
alter table public.marketplace_items    enable row level security;
alter table public.marketplace_purchases enable row level security;

-- marketplace_items policies
create policy "Anyone can view approved items"
  on public.marketplace_items for select
  using (status = 'approved');

create policy "Sellers can view own items"
  on public.marketplace_items for select
  using (seller_id = auth.uid());

create policy "Sellers can insert own items"
  on public.marketplace_items for insert
  with check (seller_id = auth.uid());

create policy "Sellers can update own items"
  on public.marketplace_items for update
  using (seller_id = auth.uid());

create policy "Admins can do everything on items"
  on public.marketplace_items for all
  using (public.is_admin_user());

-- marketplace_purchases policies
create policy "Buyers can view own purchases"
  on public.marketplace_purchases for select
  using (buyer_id = auth.uid());

create policy "Sellers can view purchases of own items"
  on public.marketplace_purchases for select
  using (
    exists (
      select 1 from public.marketplace_items mi
      where mi.id = item_id and mi.seller_id = auth.uid()
    )
  );

create policy "Authenticated users can purchase"
  on public.marketplace_purchases for insert
  with check (buyer_id = auth.uid());

create policy "Admins can view all purchases"
  on public.marketplace_purchases for select
  using (public.is_admin_user());

-- RPC: buy marketplace item (deducts coins + inserts purchase + increments counter)
create or replace function public.buy_marketplace_item(
  p_item_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item   public.marketplace_items%rowtype;
  v_wallet public.wallets%rowtype;
begin
  -- Lock and fetch item
  select * into v_item from public.marketplace_items
  where id = p_item_id and status = 'approved'
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Item not found or not approved');
  end if;

  -- Check already purchased
  if exists (
    select 1 from public.marketplace_purchases
    where buyer_id = auth.uid() and item_id = p_item_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Already purchased');
  end if;

  -- Check stock
  if v_item.stock is not null and v_item.stock <= 0 then
    return jsonb_build_object('success', false, 'error', 'Out of stock');
  end if;

  -- Fetch and lock wallet
  select * into v_wallet from public.wallets
  where user_id = auth.uid()
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Wallet not found');
  end if;

  if v_wallet.balance < v_item.coin_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient coins');
  end if;

  -- Deduct coins
  update public.wallets
  set balance = balance - v_item.coin_price
  where user_id = auth.uid();

  -- Log transaction
  insert into public.coin_transactions (user_id, amount, type, description)
  values (auth.uid(), -v_item.coin_price, 'spent', 'Marketplace: ' || v_item.title);

  -- Credit seller
  insert into public.wallets (user_id, balance)
  values (v_item.seller_id, v_item.coin_price)
  on conflict (user_id) do update
  set balance = public.wallets.balance + v_item.coin_price;

  insert into public.coin_transactions (user_id, amount, type, description)
  values (v_item.seller_id, v_item.coin_price, 'earned', 'Marketplace sale: ' || v_item.title);

  -- Create purchase record
  insert into public.marketplace_purchases (buyer_id, item_id, coins_paid)
  values (auth.uid(), p_item_id, v_item.coin_price);

  -- Decrement stock if applicable
  if v_item.stock is not null then
    update public.marketplace_items
    set stock = stock - 1, purchase_count = purchase_count + 1
    where id = p_item_id;
  else
    update public.marketplace_items
    set purchase_count = purchase_count + 1
    where id = p_item_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;
