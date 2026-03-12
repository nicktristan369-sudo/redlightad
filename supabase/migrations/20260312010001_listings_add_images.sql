alter table public.listings
  add column if not exists images text[] default '{}',
  add column if not exists profile_image text;
