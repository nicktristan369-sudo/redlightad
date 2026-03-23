-- Scraped phone numbers from URL scanning
create table if not exists public.scraped_phones (
  id         uuid primary key default gen_random_uuid(),
  phone      text not null,
  source_url text not null,
  tag        text not null default 'untagged',
  created_at timestamptz not null default now()
);

alter table public.scraped_phones enable row level security;
-- Admin-only via service role (no public RLS policies needed)
