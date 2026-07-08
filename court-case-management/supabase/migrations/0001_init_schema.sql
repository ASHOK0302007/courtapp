-- 0001_init_schema.sql
-- Core enums and tables for the Court Case Management System.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type user_role as enum ('citizen', 'court_officer', 'judge', 'admin');

create type case_status as enum (
  'submitted',
  'under_review',
  'verified',
  'assigned',
  'scheduled',
  'in_hearing',
  'judgment_published',
  'closed',
  'rejected',
  'withdrawn'
);

create type hearing_status as enum ('scheduled', 'completed', 'postponed', 'cancelled');

create type document_type as enum (
  'evidence',
  'affidavit',
  'identity_proof',
  'prior_judgment',
  'other'
);

create type document_review_status as enum ('pending', 'approved', 'rejected');

create type notification_type as enum (
  'case_status_change',
  'hearing_scheduled',
  'hearing_rescheduled',
  'judgment_published',
  'document_requested',
  'system'
);

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'citizen',
  bar_or_badge_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Application-level user profile and role, 1:1 with auth.users.';

-- ---------------------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------------------

create table cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  title text not null,
  description text not null,
  case_type text not null default 'general',
  priority text not null default 'normal',
  status case_status not null default 'submitted',
  citizen_id uuid not null references profiles (id),
  assigned_officer_id uuid references profiles (id),
  assigned_judge_id uuid references profiles (id),
  filed_at timestamptz not null default now(),
  verified_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- appeals
-- ---------------------------------------------------------------------------

create table appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  appellant_id uuid not null references profiles (id),
  grounds_for_appeal text not null,
  original_judgment_ref text,
  relief_sought text not null,
  status case_status not null default 'submitted',
  submitted_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  uploaded_by uuid not null references profiles (id),
  document_type document_type not null default 'other',
  file_name text not null,
  storage_path text not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  reviewed_by uuid references profiles (id),
  review_status document_review_status not null default 'pending',
  review_notes text,
  uploaded_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- hearings
-- ---------------------------------------------------------------------------

create table hearings (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases (id) on delete cascade,
  scheduled_by uuid not null references profiles (id),
  judge_id uuid not null references profiles (id),
  hearing_date timestamptz not null,
  location text not null,
  status hearing_status not null default 'scheduled',
  notes text,
  next_hearing_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- judgments
-- ---------------------------------------------------------------------------

create table judgments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references cases (id) on delete cascade,
  judge_id uuid not null references profiles (id),
  verdict_summary text not null,
  full_text text not null,
  document_storage_path text,
  is_final boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles (id) on delete cascade,
  case_id uuid references cases (id) on delete cascade,
  type notification_type not null,
  title text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_log
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- system_settings — simple key/value store for admin configuration
-- ---------------------------------------------------------------------------

create table system_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references profiles (id),
  updated_at timestamptz not null default now()
);

insert into system_settings (key, value) values
  ('case_number_prefix', '"CASE"'),
  ('max_upload_size_mb', '20'),
  ('allow_public_signup', 'true');
