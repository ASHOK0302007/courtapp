-- 0007_hardening.sql
-- Row Level Security in Postgres governs which ROWS a role can see or
-- touch, not which COLUMNS within an allowed row it can set. The existing
-- `cases` UPDATE policies let a citizen update their own submitted/
-- under_review case, and let an officer update any case in their queue —
-- but neither restricts *which columns* change. That means, as written
-- before this migration, a citizen could in principle set
-- assigned_officer_id/assigned_judge_id on their own row directly from the
-- client, and an officer could set status straight to 'judgment_published'
-- or 'closed', bypassing the judge entirely. This migration closes both
-- gaps with explicit column-level guards, on top of the row-level RLS
-- that was already correct.

create or replace function guard_case_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor user_role;
begin
  actor := current_role();

  -- Immutable regardless of role: case_number is system-generated,
  -- citizen_id identifies who filed it. Neither should ever change after
  -- creation.
  if new.case_number is distinct from old.case_number then
    raise exception 'case_number cannot be changed';
  end if;
  if new.citizen_id is distinct from old.citizen_id then
    raise exception 'citizen_id cannot be changed';
  end if;

  if actor = 'citizen' then
    if new.assigned_officer_id is distinct from old.assigned_officer_id
      or new.assigned_judge_id is distinct from old.assigned_judge_id
      or new.status is distinct from old.status
      or new.priority is distinct from old.priority
    then
      raise exception 'Citizens cannot change case assignment, status, or priority';
    end if;
  end if;

  if actor = 'court_officer' then
    -- Officers verify, reject, and (via assignment) move a case to
    -- 'assigned'/'scheduled' — but publishing a judgment or closing a case
    -- is a judge decision and must go through the judgments flow, which
    -- updates status via the notify_on_judgment_published() trigger, not
    -- a direct case update.
    if new.status is distinct from old.status
      and new.status in ('judgment_published', 'closed')
    then
      raise exception 'Officers cannot publish judgments or close cases directly';
    end if;
  end if;

  if actor = 'judge' then
    if new.assigned_officer_id is distinct from old.assigned_officer_id then
      raise exception 'Judges cannot reassign the court officer';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_guard_case_field_changes
  before update on cases
  for each row execute function guard_case_field_changes();

-- Same class of gap on hearings: the officer/judge UPDATE policy's USING
-- clause only checks scheduled_by/judge_id, not case_id — so in principle
-- an officer could repoint an existing hearing at a different case_id.
create or replace function guard_hearing_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.case_id is distinct from old.case_id then
    raise exception 'A hearing cannot be moved to a different case';
  end if;
  return new;
end;
$$;

create trigger trg_guard_hearing_field_changes
  before update on hearings
  for each row execute function guard_hearing_field_changes();

-- And on judgments: case_id and judge_id identify which case/judge this
-- judgment belongs to and must not be changed after the draft is created.
create or replace function guard_judgment_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.case_id is distinct from old.case_id then
    raise exception 'A judgment cannot be moved to a different case';
  end if;
  if new.judge_id is distinct from old.judge_id then
    raise exception 'A judgment cannot be reassigned to a different judge';
  end if;
  return new;
end;
$$;

create trigger trg_guard_judgment_field_changes
  before update on judgments
  for each row execute function guard_judgment_field_changes();
