-- Add verification fields to profiles
alter table public.profiles
  add column if not exists is_verified boolean not null default false,
  add column if not exists account_type text,
  add column if not exists country text;

-- Verification requests table
create table if not exists public.verification_requests (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  full_name    text,
  email        text,
  document_url text,          -- Cloudinary URL of uploaded ID
  selfie_url   text,          -- Optional selfie with ID
  status       text not null default 'pending', -- pending / approved / rejected
  note         text,          -- Admin note / rejection reason
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid
);

-- RLS
alter table public.verification_requests enable row level security;

-- User can see and insert own requests
create policy "User can view own verification" on public.verification_requests
  for select using (auth.uid() = user_id);

create policy "User can submit verification" on public.verification_requests
  for insert with check (auth.uid() = user_id);

-- Admin can do everything (SECURITY DEFINER function)
create or replace function public.admin_get_verification_requests()
returns setof public.verification_requests
language sql security definer
as $$
  select * from public.verification_requests order by created_at desc;
$$;

create or replace function public.admin_update_verification(
  p_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql security definer
as $$
begin
  update public.verification_requests
  set status = p_status,
      note = p_note,
      reviewed_at = now()
  where id = p_id;

  -- If approved: mark profile as verified
  if p_status = 'approved' then
    update public.profiles
    set is_verified = true
    where id = (select user_id from public.verification_requests where id = p_id);
  end if;
end;
$$;
