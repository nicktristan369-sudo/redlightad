-- Admin contacts (phonebook — admin only access)
create table if not exists public.admin_contacts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text,
  phone            text,
  signal_username  text,
  telegram         text,
  category         text default 'other', -- partner / advertiser / vip_user / other
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.admin_contacts enable row level security;
-- No public access — only via service role / admin API
