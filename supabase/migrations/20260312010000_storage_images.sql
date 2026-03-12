-- Create images bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880;

-- RLS: allow authenticated users to upload to their own folder only
create policy "Users upload own images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'images' AND
    (storage.foldername(name))[1] = 'listings' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- RLS: allow public read
create policy "Public read images" on storage.objects
  for select to public
  using (bucket_id = 'images');

-- RLS: allow users to delete own images
create policy "Users delete own images" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'images' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
