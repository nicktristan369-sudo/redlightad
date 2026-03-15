-- Role column on profiles
alter table public.profiles
  add column if not exists role text not null default 'user';

-- Audit log
create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  email       text,
  ip          text,
  user_agent  text,
  action      text not null, -- 'login_success' | 'login_failed' | 'logout' | 'session_expired'
  detail      text,
  created_at  timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;

-- Rate-limit table (failed login attempts per IP)
create table if not exists public.admin_login_attempts (
  id           uuid primary key default gen_random_uuid(),
  ip           text not null,
  attempted_at timestamptz not null default now(),
  success      boolean not null default false
);
alter table public.admin_login_attempts enable row level security;

-- Index for fast IP lookups
create index if not exists admin_login_attempts_ip_idx
  on public.admin_login_attempts (ip, attempted_at desc);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);
