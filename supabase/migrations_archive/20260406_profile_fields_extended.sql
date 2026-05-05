-- Extended profile fields to match EuroGirlsEscort structure
alter table public.listings
  -- Physical attributes (extended)
  add column if not exists hair_length text,
  add column if not exists bust_type text,
  add column if not exists ethnicity text,
  add column if not exists orientation text,
  add column if not exists smoker text,
  add column if not exists tattoo text,
  add column if not exists piercing text[],
  -- Travel & availability
  add column if not exists travel_availability text,
  add column if not exists available_for text,
  add column if not exists meeting_with text[],
  -- Rates (extended - matching EuroGirlsEscort rate periods)
  add column if not exists rate_30min text,
  add column if not exists rate_3hours text,
  add column if not exists rate_6hours text,
  add column if not exists rate_12hours text,
  add column if not exists rate_24hours text,
  add column if not exists rate_48hours text,
  add column if not exists rate_1hour_incall text,
  add column if not exists rate_1hour_outcall text,
  add column if not exists rate_2hours_incall text,
  add column if not exists rate_2hours_outcall text,
  add column if not exists rate_3hours_incall text,
  add column if not exists rate_3hours_outcall text,
  add column if not exists rate_6hours_incall text,
  add column if not exists rate_6hours_outcall text,
  add column if not exists rate_12hours_incall text,
  add column if not exists rate_12hours_outcall text,
  add column if not exists rate_24hours_incall text,
  add column if not exists rate_24hours_outcall text,
  add column if not exists rate_48hours_incall text,
  add column if not exists rate_48hours_outcall text,
  add column if not exists rate_currency text default 'EUR',
  -- Services with pricing (JSONB: [{service, type: "included"|"extra", price, currency}])
  add column if not exists services_detailed jsonb default '[]',
  -- Working time (JSONB: [{day, from, to, all_day}])
  add column if not exists working_time jsonb default '[]',
  add column if not exists working_timezone text default 'UTC',
  -- Contact - messaging apps
  add column if not exists viber text,
  add column if not exists wechat text,
  add column if not exists line_app text,
  add column if not exists signal text,
  add column if not exists phone2 text,
  -- Contact toggles (which apps are active)
  add column if not exists contact_viber boolean default false,
  add column if not exists contact_whatsapp boolean default false,
  add column if not exists contact_wechat boolean default false,
  add column if not exists contact_telegram boolean default false,
  add column if not exists contact_line boolean default false,
  add column if not exists contact_signal boolean default false,
  -- Profile type
  add column if not exists profile_type text default 'independent',
  -- Block country feature
  add column if not exists blocked_countries text[] default '{}';

-- Index for common filters
create index if not exists idx_listings_orientation on public.listings(orientation);
create index if not exists idx_listings_ethnicity on public.listings(ethnicity);
create index if not exists idx_listings_available_for on public.listings(available_for);
