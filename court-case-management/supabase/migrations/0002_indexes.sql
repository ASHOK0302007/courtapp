-- 0002_indexes.sql
-- Indexes to support the primary access patterns of each role.

create index idx_profiles_role on profiles (role);

create index idx_cases_citizen_id on cases (citizen_id);
create index idx_cases_assigned_officer_id on cases (assigned_officer_id);
create index idx_cases_assigned_judge_id on cases (assigned_judge_id);
create index idx_cases_status on cases (status);
create index idx_cases_case_number on cases (case_number);
create index idx_cases_filed_at on cases (filed_at desc);

create index idx_appeals_case_id on appeals (case_id);
create index idx_appeals_appellant_id on appeals (appellant_id);

create index idx_documents_case_id on documents (case_id);
create index idx_documents_uploaded_by on documents (uploaded_by);
create index idx_documents_review_status on documents (review_status);

create index idx_hearings_case_id on hearings (case_id);
create index idx_hearings_judge_id on hearings (judge_id);
create index idx_hearings_date on hearings (hearing_date);

create index idx_judgments_case_id on judgments (case_id);
create index idx_judgments_judge_id on judgments (judge_id);

create index idx_notifications_recipient_unread
  on notifications (recipient_id, is_read)
  where is_read = false;
create index idx_notifications_recipient_created
  on notifications (recipient_id, created_at desc);

create index idx_audit_log_entity on audit_log (entity_table, entity_id);
create index idx_audit_log_actor on audit_log (actor_id);
