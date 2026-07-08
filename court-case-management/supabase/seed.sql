-- seed.sql
-- Local/dev seed data. Run with `supabase db reset` (applies migrations then
-- this file). Creates one test user per role via Supabase's auth schema
-- helper, then promotes roles (bypassing the self-escalation trigger, which
-- only fires on UPDATE performed through the normal API, not raw SQL as the
-- postgres superuser in a seed script).
--
-- Passwords are for local development only — never reuse in a real
-- environment.

-- Citizen (created via handle_new_user trigger through auth.users insert)
select auth.uid(); -- no-op, ensures pgcrypto/auth schema are loaded

insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'citizen@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Casey Citizen"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'officer@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Olivia Officer"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'judge@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Jordan Judge"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'admin@example.com', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Ada Admin"}', 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- Promote roles directly (raw SQL, bypasses the API-level guard trigger)
update profiles set role = 'court_officer', bar_or_badge_id = 'OFC-1042' where id = '00000000-0000-0000-0000-000000000002';
update profiles set role = 'judge', bar_or_badge_id = 'JDG-0087' where id = '00000000-0000-0000-0000-000000000003';
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000004';

-- A sample case moving through the lifecycle
insert into cases (id, title, description, case_type, citizen_id, assigned_officer_id, assigned_judge_id, status)
values (
  '10000000-0000-0000-0000-000000000001',
  'Appeal against zoning permit denial',
  'Appellant seeks reversal of the municipal zoning board decision denying a residential permit.',
  'civil',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'assigned'
);

insert into appeals (case_id, appellant_id, grounds_for_appeal, relief_sought)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'The board failed to consider the submitted environmental impact report.',
  'Reversal of the denial and issuance of the permit.'
);
