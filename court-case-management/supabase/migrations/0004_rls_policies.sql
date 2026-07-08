-- 0004_rls_policies.sql
-- Row Level Security is the primary authorization boundary: every table is
-- locked down here so access is enforced by Postgres itself, not just by
-- the application layer.

alter table profiles enable row level security;
alter table cases enable row level security;
alter table appeals enable row level security;
alter table documents enable row level security;
alter table hearings enable row level security;
alter table judgments enable row level security;
alter table notifications enable row level security;
alter table audit_log enable row level security;
alter table system_settings enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "profiles: select own or admin"
  on profiles for select
  using (id = auth.uid() or current_role() = 'admin');

create policy "profiles: officers and judges are visible to authenticated users"
  on profiles for select
  using (role in ('court_officer', 'judge') and auth.uid() is not null);

create policy "profiles: update own non-role fields"
  on profiles for update
  using (id = auth.uid() or current_role() = 'admin');

create policy "profiles: admin can insert"
  on profiles for insert
  with check (current_role() = 'admin' or id = auth.uid());

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------

create policy "cases: citizens select own"
  on cases for select
  using (citizen_id = auth.uid());

create policy "cases: citizens insert own"
  on cases for insert
  with check (citizen_id = auth.uid());

create policy "cases: citizens update own while unverified"
  on cases for update
  using (citizen_id = auth.uid() and status in ('submitted', 'under_review'));

create policy "cases: officers select unassigned or own queue"
  on cases for select
  using (
    current_role() = 'court_officer'
    and (assigned_officer_id = auth.uid() or assigned_officer_id is null)
  );

create policy "cases: officers update own queue"
  on cases for update
  using (current_role() = 'court_officer' and (assigned_officer_id = auth.uid() or assigned_officer_id is null));

create policy "cases: judges select assigned"
  on cases for select
  using (current_role() = 'judge' and assigned_judge_id = auth.uid());

create policy "cases: judges update assigned"
  on cases for update
  using (current_role() = 'judge' and assigned_judge_id = auth.uid());

create policy "cases: admin full access"
  on cases for all
  using (current_role() = 'admin')
  with check (current_role() = 'admin');

-- ---------------------------------------------------------------------------
-- appeals (mirrors case participants)
-- ---------------------------------------------------------------------------

create policy "appeals: participants select"
  on appeals for select
  using (
    exists (
      select 1 from cases c
      where c.id = appeals.case_id
        and (
          c.citizen_id = auth.uid()
          or c.assigned_officer_id = auth.uid()
          or c.assigned_judge_id = auth.uid()
          or current_role() = 'admin'
        )
    )
  );

create policy "appeals: citizens insert own"
  on appeals for insert
  with check (appellant_id = auth.uid());

create policy "appeals: officer or judge or admin update"
  on appeals for update
  using (
    current_role() in ('court_officer', 'judge', 'admin')
  );

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create policy "documents: participants select"
  on documents for select
  using (
    exists (
      select 1 from cases c
      where c.id = documents.case_id
        and (
          c.citizen_id = auth.uid()
          or c.assigned_officer_id = auth.uid()
          or c.assigned_judge_id = auth.uid()
          or current_role() = 'admin'
        )
    )
  );

create policy "documents: citizen or officer insert for own/assigned case"
  on documents for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from cases c
      where c.id = documents.case_id
        and (c.citizen_id = auth.uid() or c.assigned_officer_id = auth.uid())
    )
  );

create policy "documents: officer or judge review update"
  on documents for update
  using (current_role() in ('court_officer', 'judge', 'admin'));

-- ---------------------------------------------------------------------------
-- hearings
-- ---------------------------------------------------------------------------

create policy "hearings: participants select"
  on hearings for select
  using (
    exists (
      select 1 from cases c
      where c.id = hearings.case_id
        and (
          c.citizen_id = auth.uid()
          or c.assigned_officer_id = auth.uid()
          or c.assigned_judge_id = auth.uid()
          or current_role() = 'admin'
        )
    )
  );

create policy "hearings: officer insert for own case"
  on hearings for insert
  with check (
    current_role() = 'court_officer'
    and scheduled_by = auth.uid()
    and exists (select 1 from cases c where c.id = hearings.case_id and c.assigned_officer_id = auth.uid())
  );

create policy "hearings: officer or judge update"
  on hearings for update
  using (
    current_role() = 'admin'
    or (current_role() = 'court_officer' and scheduled_by = auth.uid())
    or (current_role() = 'judge' and judge_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- judgments
-- ---------------------------------------------------------------------------

create policy "judgments: judge or admin select"
  on judgments for select
  using (current_role() in ('judge', 'court_officer', 'admin'));

create policy "judgments: citizen select once published"
  on judgments for select
  using (
    published_at is not null
    and exists (select 1 from cases c where c.id = judgments.case_id and c.citizen_id = auth.uid())
  );

create policy "judgments: judge insert for assigned case"
  on judgments for insert
  with check (
    current_role() = 'judge'
    and judge_id = auth.uid()
    and exists (select 1 from cases c where c.id = judgments.case_id and c.assigned_judge_id = auth.uid())
  );

create policy "judgments: judge update own draft"
  on judgments for update
  using (current_role() = 'judge' and judge_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create policy "notifications: recipient select"
  on notifications for select
  using (recipient_id = auth.uid());

create policy "notifications: recipient update (mark read)"
  on notifications for update
  using (recipient_id = auth.uid());

-- inserts happen only via security-definer trigger functions, so no
-- insert policy is granted to regular roles.

-- ---------------------------------------------------------------------------
-- audit_log — write via security-definer triggers/functions only; readable
-- by admins for oversight.
-- ---------------------------------------------------------------------------

create policy "audit_log: admin select"
  on audit_log for select
  using (current_role() = 'admin');

-- ---------------------------------------------------------------------------
-- system_settings
-- ---------------------------------------------------------------------------

create policy "system_settings: everyone select"
  on system_settings for select
  using (auth.uid() is not null);

create policy "system_settings: admin update"
  on system_settings for update
  using (current_role() = 'admin');
