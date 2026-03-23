-- Phone verification
alter table public.profiles
  add column if not exists phone text,
  add column if not exists phone_verified boolean not null default false;

create table if not exists public.phone_verification_codes (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code        text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.phone_verification_codes enable row level security;
create policy "Public can insert code" on public.phone_verification_codes for insert with check (true);
