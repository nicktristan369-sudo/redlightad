-- ─── Admin Inbox ───────────────────────────────────────────────────────────
create table if not exists public.admin_inbox (
  id           uuid primary key default gen_random_uuid(),
  from_name    text,
  from_email   text,
  subject      text,
  message      text not null,
  category     text default 'support', -- support / report / payment / other
  is_read      boolean not null default false,
  replied      boolean not null default false,
  reply_body   text,
  replied_at   timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.admin_inbox enable row level security;
-- Only admins (via SECURITY DEFINER functions below)
create policy "No direct access" on public.admin_inbox using (false);

-- Public can insert (contact form)
create policy "Public can submit" on public.admin_inbox
  for insert with check (true);

-- ─── SMS Log ────────────────────────────────────────────────────────────────
create table if not exists public.sms_log (
  id           uuid primary key default gen_random_uuid(),
  to_user_id   uuid references auth.users(id) on delete set null,
  phone_number text,
  message      text not null,
  status       text not null default 'sent', -- sent / failed
  direction    text not null default 'outbound', -- outbound / broadcast
  recipients   integer default 1,
  error_msg    text,
  created_at   timestamptz not null default now()
);

alter table public.sms_log enable row level security;
create policy "No direct access sms" on public.sms_log using (false);

-- ─── Broadcast History ──────────────────────────────────────────────────────
create table if not exists public.broadcast_history (
  id               uuid primary key default gen_random_uuid(),
  subject          text not null,
  body             text not null,
  recipients_type  text not null, -- all / providers / customers / country / tier
  recipients_filter jsonb,
  recipients_count integer default 0,
  status           text not null default 'sent', -- sent / failed / draft
  resend_ids       text[],
  created_at       timestamptz not null default now()
);

alter table public.broadcast_history enable row level security;
create policy "No direct access broadcast" on public.broadcast_history using (false);
