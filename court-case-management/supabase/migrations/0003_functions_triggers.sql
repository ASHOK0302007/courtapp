-- 0003_functions_triggers.sql
-- Helper functions and triggers: role lookup, new-user provisioning, case
-- numbering, updated_at maintenance, role-escalation guard, and
-- notification-on-status-change.

-- ---------------------------------------------------------------------------
-- current_role(): resolves the caller's role from profiles.
-- security definer so it can read profiles regardless of the caller's own
-- row-level policies (it only ever returns a single enum value, never a row).
-- ---------------------------------------------------------------------------

create or replace function current_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- handle_new_user(): auto-create a profile row when a new auth.users row is
-- inserted. Every self-service signup becomes a citizen; other roles are
-- only ever granted by an admin via the admin panel afterwards.
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Unnamed user'),
    new.email,
    'citizen'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- prevent_role_self_escalation(): blocks any update to profiles.role unless
-- performed by an admin. Closes the gap where RLS would otherwise allow a
-- user to update their own non-role columns and smuggle a role change in
-- through the same statement.
-- ---------------------------------------------------------------------------

create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and current_role() is distinct from 'admin' then
    raise exception 'Only an admin can change a user role';
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_self_escalation
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- ---------------------------------------------------------------------------
-- set_updated_at(): generic updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at before update on profiles
  for each row execute function set_updated_at();
create trigger trg_cases_updated_at before update on cases
  for each row execute function set_updated_at();
create trigger trg_hearings_updated_at before update on hearings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- generate_case_number(): assigns a human-readable case number such as
-- CASE-2026-000123 on insert, using the configurable prefix from
-- system_settings and a per-year sequence.
-- ---------------------------------------------------------------------------

create sequence if not exists case_number_seq;

create or replace function generate_case_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text;
  next_val bigint;
begin
  if new.case_number is not null then
    return new;
  end if;

  select value #>> '{}' into prefix from system_settings where key = 'case_number_prefix';
  prefix := coalesce(prefix, 'CASE');
  next_val := nextval('case_number_seq');

  new.case_number := prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(next_val::text, 6, '0');
  return new;
end;
$$;

create trigger trg_generate_case_number
  before insert on cases
  for each row execute function generate_case_number();

-- ---------------------------------------------------------------------------
-- notify_on_case_status_change(): writes a notification row for the citizen
-- whenever their case's status changes.
-- ---------------------------------------------------------------------------

create or replace function notify_on_case_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into notifications (recipient_id, case_id, type, title, message)
    values (
      new.citizen_id,
      new.id,
      'case_status_change',
      'Case status updated',
      'Your case ' || new.case_number || ' status changed to ' || new.status
    );

    insert into audit_log (actor_id, action, entity_table, entity_id, metadata)
    values (
      auth.uid(),
      'case.status_changed',
      'cases',
      new.id,
      jsonb_build_object('from', old.status, 'to', new.status)
    );
  end if;
  return new;
end;
$$;

create trigger trg_notify_case_status_change
  after update on cases
  for each row execute function notify_on_case_status_change();

-- ---------------------------------------------------------------------------
-- notify_on_hearing_scheduled(): notifies the citizen when a hearing is
-- created or rescheduled for their case.
-- ---------------------------------------------------------------------------

create or replace function notify_on_hearing_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_citizen_id uuid;
  v_case_number text;
begin
  select citizen_id, case_number into v_citizen_id, v_case_number
  from cases where id = new.case_id;

  insert into notifications (recipient_id, case_id, type, title, message)
  values (
    v_citizen_id,
    new.case_id,
    case when tg_op = 'INSERT' then 'hearing_scheduled' else 'hearing_rescheduled' end,
    case when tg_op = 'INSERT' then 'Hearing scheduled' else 'Hearing updated' end,
    'Case ' || v_case_number || ' hearing set for ' || to_char(new.hearing_date, 'YYYY-MM-DD HH24:MI')
  );
  return new;
end;
$$;

create trigger trg_notify_hearing_insert
  after insert on hearings
  for each row execute function notify_on_hearing_change();

create trigger trg_notify_hearing_update
  after update on hearings
  for each row
  when (old.hearing_date is distinct from new.hearing_date or old.status is distinct from new.status)
  execute function notify_on_hearing_change();

-- ---------------------------------------------------------------------------
-- notify_on_judgment_published(): notifies the citizen when a judgment is
-- published, and closes the case.
-- ---------------------------------------------------------------------------

create or replace function notify_on_judgment_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_citizen_id uuid;
  v_case_number text;
begin
  if new.published_at is not null and old.published_at is null then
    select citizen_id, case_number into v_citizen_id, v_case_number
    from cases where id = new.case_id;

    insert into notifications (recipient_id, case_id, type, title, message)
    values (
      v_citizen_id,
      new.case_id,
      'judgment_published',
      'Judgment published',
      'A judgment has been published for case ' || v_case_number
    );

    update cases
      set status = 'judgment_published', closed_at = now()
      where id = new.case_id;
  end if;
  return new;
end;
$$;

create trigger trg_notify_judgment_published
  after update on judgments
  for each row execute function notify_on_judgment_published();
