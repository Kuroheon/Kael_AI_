
/*
# Kael AI - Core Schema

## Summary
Creates the full database schema for the Kael AI autonomous agent system.

## New Tables

### sessions
Tracks conversation sessions with context rolling summaries.
- id (uuid, primary key)
- title (text) - session display name
- summary (text) - rolling context summary
- created_at, updated_at

### messages
All chat messages with role, content, streaming tokens, and tool calls.
- id (uuid, primary key)
- session_id (uuid, FK to sessions)
- role (text: user | assistant | system | tool)
- content (text)
- tokens (integer)
- tool_calls (jsonb) - tool invocations embedded in message
- metadata (jsonb) - extra data (model, duration, etc.)
- created_at

### memories
Long-term memory store (RAG simulation).
- id (uuid, primary key)
- session_id (uuid, nullable FK)
- content (text) - the memory content
- category (text: fact | task | preference | document | code)
- importance (integer 1-10)
- embedding_sim (text) - keyword tags for retrieval simulation
- created_at

### tasks
Multi-step task plans with execution state.
- id (uuid, primary key)
- session_id (uuid, FK)
- title (text)
- description (text)
- steps (jsonb array) - [{id, title, status, result, tool}]
- status (text: pending | running | completed | failed | cancelled)
- current_step (integer)
- created_at, updated_at

### documents
Document/file management with versioning.
- id (uuid, primary key)
- title (text)
- content (text)
- language (text) - markdown | typescript | python | json | plaintext
- version (integer)
- versions (jsonb array) - snapshot history
- path (text) - virtual file path
- created_at, updated_at

### capabilities
Capability registry listing all tools/skills Kael has.
- id (uuid, primary key)
- name (text, unique)
- description (text)
- category (text: core | tool | integration | user_defined)
- status (text: active | disabled | testing | deprecated)
- permissions (jsonb array) - required permission levels
- code_snippet (text) - implementation reference
- version (text)
- usage_count (integer)
- created_at, updated_at

### capability_proposals
Proposed new capabilities awaiting sandbox test and user approval.
- id (uuid, primary key)
- name (text)
- description (text)
- rationale (text)
- code_draft (text)
- test_results (jsonb)
- status (text: draft | testing | awaiting_approval | approved | rejected | registered)
- proposed_by (text: kael | user)
- created_at, updated_at

### tool_executions
Record of every tool call with inputs, outputs, and outcome.
- id (uuid, primary key)
- session_id (uuid, nullable FK)
- task_id (uuid, nullable FK)
- tool_name (text)
- input (jsonb)
- output (jsonb)
- status (text: running | success | error | cancelled)
- duration_ms (integer)
- created_at

### audit_logs
Full audit trail of all mutations and critical actions.
- id (uuid, primary key)
- action (text) - action type identifier
- actor (text: kael | user | system)
- target_type (text) - entity type affected
- target_id (uuid, nullable)
- details (jsonb)
- risk_level (text: low | medium | high | critical)
- approved_by (text, nullable)
- created_at

## Security
- RLS enabled on all tables
- anon + authenticated access (no sign-in required)
*/

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Session',
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE TO anon, authenticated USING (true);

-- MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL DEFAULT '',
  tokens integer DEFAULT 0,
  tool_calls jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_session_id_idx ON messages(session_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
DROP POLICY IF EXISTS "anon_update_messages" ON messages;
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);

-- MEMORIES
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'fact' CHECK (category IN ('fact','task','preference','document','code','context')),
  importance integer NOT NULL DEFAULT 5 CHECK (importance BETWEEN 1 AND 10),
  embedding_sim text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS memories_category_idx ON memories(category);
CREATE INDEX IF NOT EXISTS memories_importance_idx ON memories(importance DESC);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_memories" ON memories;
DROP POLICY IF EXISTS "anon_insert_memories" ON memories;
DROP POLICY IF EXISTS "anon_update_memories" ON memories;
DROP POLICY IF EXISTS "anon_delete_memories" ON memories;
CREATE POLICY "anon_select_memories" ON memories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_memories" ON memories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_memories" ON memories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_memories" ON memories FOR DELETE TO anon, authenticated USING (true);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
  current_step integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_session_id_idx ON tasks(session_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE TO anon, authenticated USING (true);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'markdown' CHECK (language IN ('markdown','typescript','javascript','python','json','yaml','plaintext','css','html')),
  version integer NOT NULL DEFAULT 1,
  versions jsonb NOT NULL DEFAULT '[]'::jsonb,
  path text NOT NULL DEFAULT '/',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_path_idx ON documents(path);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- CAPABILITIES
CREATE TABLE IF NOT EXISTS capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'core' CHECK (category IN ('core','tool','integration','user_defined')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','testing','deprecated')),
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  code_snippet text DEFAULT '',
  version text NOT NULL DEFAULT '1.0.0',
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_capabilities" ON capabilities;
DROP POLICY IF EXISTS "anon_insert_capabilities" ON capabilities;
DROP POLICY IF EXISTS "anon_update_capabilities" ON capabilities;
DROP POLICY IF EXISTS "anon_delete_capabilities" ON capabilities;
CREATE POLICY "anon_select_capabilities" ON capabilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_capabilities" ON capabilities FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_capabilities" ON capabilities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_capabilities" ON capabilities FOR DELETE TO anon, authenticated USING (true);

-- CAPABILITY PROPOSALS
CREATE TABLE IF NOT EXISTS capability_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  rationale text DEFAULT '',
  code_draft text DEFAULT '',
  test_results jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','testing','awaiting_approval','approved','rejected','registered')),
  proposed_by text NOT NULL DEFAULT 'kael' CHECK (proposed_by IN ('kael','user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE capability_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_capability_proposals" ON capability_proposals;
DROP POLICY IF EXISTS "anon_insert_capability_proposals" ON capability_proposals;
DROP POLICY IF EXISTS "anon_update_capability_proposals" ON capability_proposals;
DROP POLICY IF EXISTS "anon_delete_capability_proposals" ON capability_proposals;
CREATE POLICY "anon_select_capability_proposals" ON capability_proposals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_capability_proposals" ON capability_proposals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_capability_proposals" ON capability_proposals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_capability_proposals" ON capability_proposals FOR DELETE TO anon, authenticated USING (true);

-- TOOL EXECUTIONS
CREATE TABLE IF NOT EXISTS tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  tool_name text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb DEFAULT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','success','error','cancelled')),
  duration_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_executions_session_idx ON tool_executions(session_id);
CREATE INDEX IF NOT EXISTS tool_executions_task_idx ON tool_executions(task_id);

ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "anon_insert_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "anon_update_tool_executions" ON tool_executions;
DROP POLICY IF EXISTS "anon_delete_tool_executions" ON tool_executions;
CREATE POLICY "anon_select_tool_executions" ON tool_executions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_tool_executions" ON tool_executions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_tool_executions" ON tool_executions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_tool_executions" ON tool_executions FOR DELETE TO anon, authenticated USING (true);

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  actor text NOT NULL DEFAULT 'system' CHECK (actor IN ('kael','user','system')),
  target_type text NOT NULL DEFAULT 'system',
  target_id uuid DEFAULT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  approved_by text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_risk_level_idx ON audit_logs(risk_level);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_update_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "anon_delete_audit_logs" ON audit_logs;
CREATE POLICY "anon_select_audit_logs" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "anon_insert_audit_logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "anon_update_audit_logs" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_audit_logs" ON audit_logs FOR DELETE TO anon, authenticated USING (true);
