export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  tokens: number;
  tool_calls: ToolCall[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Session {
  id: string;
  title: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  session_id: string | null;
  content: string;
  category: 'fact' | 'task' | 'preference' | 'document' | 'code' | 'context';
  importance: number;
  embedding_sim: string;
  created_at: string;
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface TaskStep {
  id: string;
  title: string;
  status: TaskStatus;
  result?: string;
  tool?: string;
  error?: string;
}

export interface Task {
  id: string;
  session_id: string;
  title: string;
  description: string;
  steps: TaskStep[];
  status: TaskStatus;
  current_step: number;
  created_at: string;
  updated_at: string;
}

export type DocLanguage =
  | 'markdown'
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'json'
  | 'yaml'
  | 'plaintext'
  | 'css'
  | 'html';

export interface DocumentVersion {
  version: number;
  content: string;
  saved_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  language: DocLanguage;
  version: number;
  versions: DocumentVersion[];
  path: string;
  created_at: string;
  updated_at: string;
}

export type CapabilityStatus = 'active' | 'disabled' | 'testing' | 'deprecated';
export type CapabilityCategory = 'core' | 'tool' | 'integration' | 'user_defined';

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  status: CapabilityStatus;
  permissions: string[];
  code_snippet: string;
  version: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export type ProposalStatus =
  | 'draft'
  | 'testing'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'registered';

export interface CapabilityProposal {
  id: string;
  name: string;
  description: string;
  rationale: string;
  code_draft: string;
  test_results: Record<string, unknown> | null;
  status: ProposalStatus;
  proposed_by: 'kael' | 'user';
  created_at: string;
  updated_at: string;
}

export type ToolExecutionStatus = 'running' | 'success' | 'error' | 'cancelled';

export interface ToolExecution {
  id: string;
  session_id: string | null;
  task_id: string | null;
  tool_name: string;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  status: ToolExecutionStatus;
  duration_ms: number;
  created_at: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLog {
  id: string;
  action: string;
  actor: 'kael' | 'user' | 'system';
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  risk_level: RiskLevel;
  approved_by: string | null;
  created_at: string;
}

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status?: ToolExecutionStatus;
}

export interface StreamToken {
  text: string;
  done: boolean;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  task?: Partial<Task>;
  memories?: Partial<Memory>[];
}
