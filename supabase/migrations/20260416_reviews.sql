-- Reviews system for listings
-- Premium users can enable/disable reviews on their profiles

-- Add show_reviews toggle to listings (default false for backwards compatibility)
alter table public.listings add column if not exists show_reviews boolean default false;

-- Create reviews table
create table if not exists public.listing_reviews (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewer_name text, -- Anonymous name if not logged in or wants privacy
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  body text,
  images text[] default '{}',
  is_verified boolean default false, -- Admin verified the review
  is_approved boolean default true, -- Moderation flag
  helpful_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_listing_reviews_listing_id on public.listing_reviews(listing_id);
create index if not exists idx_listing_reviews_created_at on public.listing_reviews(created_at desc);

-- RLS policies
alter table public.listing_reviews enable row level security;

-- Anyone can view approved reviews on listings that have show_reviews enabled
create policy "Public can view approved reviews" on public.listing_reviews
  for select using (
    is_approved = true
    and exists (
      select 1 from public.listings
      where id = listing_id
      and status = 'active'
      and show_reviews = true
    )
  );

-- Logged-in users can create reviews
create policy "Users can create reviews" on public.listing_reviews
  for insert with check (auth.uid() is not null);

-- Users can update their own reviews
create policy "Users can update own reviews" on public.listing_reviews
  for update using (auth.uid() = reviewer_id);

-- Users can delete their own reviews
create policy "Users can delete own reviews" on public.listing_reviews
  for delete using (auth.uid() = reviewer_id);

-- Admins can view all reviews (for moderation)
create policy "Admins can view all reviews" on public.listing_reviews
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Admins can update any review (for moderation)
create policy "Admins can update any review" on public.listing_reviews
  for update using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Admins can delete any review
create policy "Admins can delete any review" on public.listing_reviews
  for delete using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Review helpful votes tracking
create table if not exists public.review_helpful_votes (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.listing_reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(review_id, user_id)
);

alter table public.review_helpful_votes enable row level security;

create policy "Users can vote helpful" on public.review_helpful_votes
  for insert with check (auth.uid() = user_id);

create policy "Users can see own votes" on public.review_helpful_votes
  for select using (auth.uid() = user_id);

create policy "Users can remove own votes" on public.review_helpful_votes
  for delete using (auth.uid() = user_id);

-- Function to update helpful_count when votes change
create or replace function update_review_helpful_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.listing_reviews
    set helpful_count = helpful_count + 1
    where id = new.review_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.listing_reviews
    set helpful_count = helpful_count - 1
    where id = old.review_id;
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trigger_update_helpful_count
after insert or delete on public.review_helpful_votes
for each row execute function update_review_helpful_count();
