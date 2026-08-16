# Kael_AI_

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-uvbgyi2x)

## Required Supabase tables (minimal)

The application expects the following minimal tables and columns in Supabase:

sessions
- id (text/uuid primary key)
- title (text)
- summary (text)
- created_at (timestamp)
- updated_at (timestamp)

messages
- id
- session_id
- role
- content
- tokens
- tool_calls
- metadata
- created_at

memories
- id
- session_id
- content
- category
- importance
- embedding_sim
- created_at

tasks
- id
- session_id
- title
- steps (jsonb)
- status
- current_step
- created_at
- updated_at

Add these tables in your Supabase project before running the app locally.
