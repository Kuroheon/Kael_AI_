-- Init schema for Kael_AI_ frontend (TEXT IDs)
-- This migration uses text IDs (default generated from gen_random_uuid()::text)
-- so client-generated local IDs (e.g., "local-12345") are accepted without casting errors.

create extension if not exists pgcrypto;

-- Timestamp trigger helper
create or replace function set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- sessions table (id as text)
create table if not exists sessions (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sessions_updated_at on sessions (updated_at);
create trigger sessions_set_timestamp
before update on sessions
for each row
execute function set_timestamp();

-- messages table (session_id as text)
create table if not exists messages (
  id text primary key default gen_random_uuid()::text,
  session_id text references sessions(id) on delete cascade,
  role text not null,
  content text,
  tokens int,
  tool_calls jsonb default '[]'::jsonb,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_session_id on messages (session_id);
create index if not exists idx_messages_created_at on messages (created_at);

-- memories table (session_id as text)
create table if not exists memories (
  id text primary key default gen_random_uuid()::text,
  session_id text references sessions(id),
  content text not null,
  category text,
  importance int default 1,
  embedding_sim text,
  created_at timestamptz default now()
);

create index if not exists idx_memories_session_id on memories (session_id);
create index if not exists idx_memories_importance on memories (importance);

-- tasks table (session_id as text)
create table if not exists tasks (
  id text primary key default gen_random_uuid()::text,
  session_id text references sessions(id),
  title text,
  description text,
  steps jsonb default '[]'::jsonb,
  status text,
  current_step int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tasks_session_id on tasks (session_id);
create trigger tasks_set_timestamp
before update on tasks
for each row
execute function set_timestamp();

-- audit_logs table (ids as text)
create table if not exists audit_logs (
  id text primary key default gen_random_uuid()::text,
  action text not null,
  actor text,
  target_type text,
  target_id text,
  details jsonb default '{}'::jsonb,
  risk_level text,
  approved_by text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at);

-- DEV-friendly RLS policies (commented out) — enable only for local testing
-- Uncomment to allow anon inserts/selects during development only.

-- alter table sessions enable row level security;
-- create policy dev_allow_sessions_insert on sessions for insert using (true) with check (true);
-- create policy dev_allow_sessions_select on sessions for select using (true);

-- alter table messages enable row level security;
-- create policy dev_allow_messages on messages for all using (true) with check (true);

-- alter table memories enable row level security;
-- create policy dev_allow_memories on memories for all using (true) with check (true);

-- alter table tasks enable row level security;
-- create policy dev_allow_tasks on tasks for all using (true) with check (true);
