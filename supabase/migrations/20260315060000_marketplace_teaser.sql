-- Teaser video URL (max 9s, free preview)
alter table public.marketplace_items
  add column if not exists teaser_url text;

-- 19% platform commission on buy
CREATE OR REPLACE FUNCTION public.buy_marketplace_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  v_item          public.marketplace_items%rowtype;
  v_wallet        public.wallets%rowtype;
  v_commission    integer;
  v_seller_amount integer;
begin
  select * into v_item from public.marketplace_items
  where id = p_item_id and status = 'approved'
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Item not found or not approved');
  end if;

  if exists (
    select 1 from public.marketplace_purchases
    where buyer_id = auth.uid() and item_id = p_item_id
  ) then
    return jsonb_build_object('success', false, 'error', 'Already purchased');
  end if;

  if v_item.stock is not null and v_item.stock <= 0 then
    return jsonb_build_object('success', false, 'error', 'Out of stock');
  end if;

  select * into v_wallet from public.wallets
  where user_id = auth.uid()
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Wallet not found');
  end if;

  if v_wallet.balance < v_item.coin_price then
    return jsonb_build_object('success', false, 'error', 'Insufficient coins');
  end if;

  -- 19% platform commission
  v_commission    := round(v_item.coin_price * 0.19);
  v_seller_amount := v_item.coin_price - v_commission;

  -- Deduct from buyer
  update public.wallets set balance = balance - v_item.coin_price
  where user_id = auth.uid();

  insert into public.coin_transactions (user_id, amount, type, description)
  values (auth.uid(), -v_item.coin_price, 'spent', 'Marketplace: ' || v_item.title);

  -- Credit seller (after 19% commission)
  insert into public.wallets (user_id, balance)
  values (v_item.seller_id, v_seller_amount)
  on conflict (user_id) do update
  set balance = public.wallets.balance + v_seller_amount;

  insert into public.coin_transactions (user_id, amount, type, description)
  values (v_item.seller_id, v_seller_amount, 'earned',
          'Marketplace sale (after 19% fee): ' || v_item.title);

  insert into public.marketplace_purchases (buyer_id, item_id, coins_paid)
  values (auth.uid(), p_item_id, v_item.coin_price);

  if v_item.stock is not null then
    update public.marketplace_items
    set stock = stock - 1, purchase_count = purchase_count + 1
    where id = p_item_id;
  else
    update public.marketplace_items
    set purchase_count = purchase_count + 1
    where id = p_item_id;
  end if;

  return jsonb_build_object('success', true, 'seller_received', v_seller_amount, 'commission', v_commission);
end;
$$;
