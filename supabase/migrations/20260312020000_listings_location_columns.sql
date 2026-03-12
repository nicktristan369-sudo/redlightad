alter table public.listings
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists city text;
