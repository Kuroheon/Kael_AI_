# Kael_AI_

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-uvbgyi2x)

## Required Supabase tables (minimal)

The application expects the following minimal tables and columns in Supabase. IDs are stored as text (defaulting to a generated UUID text) so that both server-generated UUIDs and client temporary IDs (e.g. `local-12345`) are accepted.

sessions
- id (text primary key, default gen_random_uuid()::text)
- title (text, NOT NULL)
- summary (text)
- created_at (timestamp)
- updated_at (timestamp)

messages
- id (text primary key, default gen_random_uuid()::text)
- session_id (text) - references sessions(id)
- role (text)
- content (text)
- tokens (int)
- tool_calls (jsonb)
- metadata (jsonb)
- created_at (timestamp)

memories
- id (text primary key, default gen_random_uuid()::text)
- session_id (text) - references sessions(id)
- content (text)
- category (text)
- importance (int)
- embedding_sim (text)
- created_at (timestamp)

tasks
- id (text primary key, default gen_random_uuid()::text)
- session_id (text) - references sessions(id)
- title (text)
- description (text)
- steps (jsonb)
- status (text)
- current_step (int)
- created_at (timestamp)
- updated_at (timestamp)

audit_logs
- id (text primary key, default gen_random_uuid()::text)
- action (text)
- actor (text)
- target_type (text)
- target_id (text)
- details (jsonb)
- risk_level (text)
- approved_by (text)
- created_at (timestamp)

Add these tables in your Supabase project (or run `scripts/supabase/init.sql`) before running the app locally.
