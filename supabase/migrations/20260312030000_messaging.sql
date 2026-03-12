-- Conversations table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  listing_id uuid references public.listings(id) on delete set null,
  provider_id uuid references auth.users(id) on delete cascade not null,
  customer_id uuid references auth.users(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz default now(),
  provider_unread int default 0,
  customer_unread int default 0,
  created_at timestamptz default now(),
  unique(listing_id, customer_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: only participants can see/insert
create policy "Participants view conversations" on public.conversations
  for select using (auth.uid() = provider_id or auth.uid() = customer_id);

create policy "Customers create conversations" on public.conversations
  for insert with check (auth.uid() = customer_id);

create policy "Participants update conversations" on public.conversations
  for update using (auth.uid() = provider_id or auth.uid() = customer_id);

-- Messages: only conversation participants
create policy "Participants view messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.provider_id = auth.uid() or c.customer_id = auth.uid())
    )
  );

create policy "Participants send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
      and (c.provider_id = auth.uid() or c.customer_id = auth.uid())
    )
  );

-- Enable realtime
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
