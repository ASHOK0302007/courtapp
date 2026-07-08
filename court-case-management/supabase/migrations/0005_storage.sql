-- 0005_storage.sql
-- Private storage bucket for case documents and judgment PDFs, path-namespaced
-- by case id: {case_id}/{uuid}-{filename}. Access mirrors the `documents`
-- table RLS policies.

insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

create policy "case-documents: participants read"
  on storage.objects for select
  using (
    bucket_id = 'case-documents'
    and exists (
      select 1 from cases c
      where c.id::text = (storage.foldername(name))[1]
        and (
          c.citizen_id = auth.uid()
          or c.assigned_officer_id = auth.uid()
          or c.assigned_judge_id = auth.uid()
          or current_role() = 'admin'
        )
    )
  );

create policy "case-documents: citizen or officer upload to own/assigned case"
  on storage.objects for insert
  with check (
    bucket_id = 'case-documents'
    and exists (
      select 1 from cases c
      where c.id::text = (storage.foldername(name))[1]
        and (c.citizen_id = auth.uid() or c.assigned_officer_id = auth.uid())
    )
  );

create policy "case-documents: admin delete"
  on storage.objects for delete
  using (bucket_id = 'case-documents' and current_role() = 'admin');
