
create policy "media admin all" on storage.objects for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "media own read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = 'user' and (storage.foldername(name))[2] = auth.uid()::text);
