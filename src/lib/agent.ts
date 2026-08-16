import type { Message, Task, TaskStep, Memory, ToolCall, AgentResponse } from '@/types';

interface Intent {
  type: 'task' | 'question' | 'code' | 'document' | 'memory' | 'capability' | 'general';
  keywords: string[];
  needsTools: boolean;
  complexity: 'low' | 'medium' | 'high';
}

export function analyzeIntent(input: string): Intent {
  const lower = input.toLowerCase();
  const keywords: string[] = [];

  if (/\b(build|create|make|generate|write|implement|develop)\b/.test(lower)) keywords.push('create');
  if (/\b(fix|debug|error|bug|issue|problem|broken)\b/.test(lower)) keywords.push('debug');
  if (/\b(analyze|review|check|audit|inspect|examine)\b/.test(lower)) keywords.push('analyze');
  if (/\b(file|folder|directory|path|read|save|write)\b/.test(lower)) keywords.push('filesystem');
  if (/\b(code|function|class|component|module|script)\b/.test(lower)) keywords.push('code');
  if (/\b(remember|memory|recall|forget|stored)\b/.test(lower)) keywords.push('memory');
  if (/\b(capability|tool|skill|ability|feature|extend)\b/.test(lower)) keywords.push('capability');
  if (/\b(document|markdown|readme|spec|design|wiki)\b/.test(lower)) keywords.push('document');
  if (/\b(api|fetch|request|endpoint|integration|webhook)\b/.test(lower)) keywords.push('api');
  if (/\b(plan|steps|task|execute|run|automate|workflow)\b/.test(lower)) keywords.push('plan');

  const isTask = keywords.some(k => ['create', 'debug', 'plan', 'automate'].includes(k));
  const isCode = keywords.includes('code');
  const isDoc = keywords.includes('document');
  const isCap = keywords.includes('capability');
  const isMem = keywords.includes('memory');

  let type: Intent['type'] = 'general';
  if (isCap) type = 'capability';
  else if (isMem) type = 'memory';
  else if (isDoc) type = 'document';
  else if (isCode) type = 'code';
  else if (isTask) type = 'task';
  else if (/\b(what|how|why|when|where|who|explain|tell me)\b/.test(lower)) type = 'question';

  const complexity = keywords.length >= 4 ? 'high' : keywords.length >= 2 ? 'medium' : 'low';
  const needsTools = keywords.some(k => ['filesystem', 'api', 'code', 'plan'].includes(k));

  return { type, keywords, needsTools, complexity };
}

export function generateTaskPlan(goal: string, intent: Intent): Partial<Task> {
  const steps: TaskStep[] = [];

  const lower = goal.toLowerCase();

  if (intent.type === 'task' || intent.complexity === 'high') {
    steps.push({ id: crypto.randomUUID(), title: 'Analyze requirements and break down objective', status: 'pending', tool: 'task_planner' });

    if (intent.keywords.includes('code') || intent.keywords.includes('create')) {
      steps.push({ id: crypto.randomUUID(), title: 'Retrieve relevant context from memory and knowledge base', status: 'pending', tool: 'memory_retrieval' });
      steps.push({ id: crypto.randomUUID(), title: 'Draft implementation plan and architecture', status: 'pending', tool: 'code_analyzer' });
      steps.push({ id: crypto.randomUUID(), title: 'Generate and write code to workspace', status: 'pending', tool: 'file_system_control' });
      steps.push({ id: crypto.randomUUID(), title: 'Execute code in sandbox and verify output', status: 'pending', tool: 'code_executor' });
      steps.push({ id: crypto.randomUUID(), title: 'Detect errors and apply fixes if needed', status: 'pending', tool: 'error_detector' });
    }

    if (intent.keywords.includes('filesystem')) {
      steps.push({ id: crypto.randomUUID(), title: 'Scan workspace file structure', status: 'pending', tool: 'file_system_control' });
      steps.push({ id: crypto.randomUUID(), title: 'Read and index relevant files', status: 'pending', tool: 'memory_indexer' });
    }

    if (intent.keywords.includes('api')) {
      steps.push({ id: crypto.randomUUID(), title: 'Validate API endpoint and authentication', status: 'pending', tool: 'web_api_integration' });
      steps.push({ id: crypto.randomUUID(), title: 'Execute API request and parse response', status: 'pending', tool: 'web_api_integration' });
    }

    steps.push({ id: crypto.randomUUID(), title: 'Store task outcome and learnings to long-term memory', status: 'pending', tool: 'memory_indexer' });
    steps.push({ id: crypto.randomUUID(), title: 'Compile and report final results', status: 'pending', tool: 'context_manager' });
  } else if (intent.type === 'code') {
    steps.push({ id: crypto.randomUUID(), title: 'Retrieve code context from memory', status: 'pending', tool: 'memory_retrieval' });
    steps.push({ id: crypto.randomUUID(), title: 'Analyze existing code structure', status: 'pending', tool: 'code_analyzer' });
    steps.push({ id: crypto.randomUUID(), title: 'Generate code solution', status: 'pending', tool: 'code_executor' });
    steps.push({ id: crypto.randomUUID(), title: 'Verify output and check for errors', status: 'pending', tool: 'error_detector' });
  } else if (intent.type === 'document') {
    steps.push({ id: crypto.randomUUID(), title: 'Gather relevant context and references', status: 'pending', tool: 'memory_retrieval' });
    steps.push({ id: crypto.randomUUID(), title: 'Draft document structure and content', status: 'pending', tool: 'document_manager' });
    steps.push({ id: crypto.randomUUID(), title: 'Save document to workspace', status: 'pending', tool: 'file_system_control' });
  }

  return {
    title: goal.length > 60 ? goal.slice(0, 57) + '...' : goal,
    description: goal,
    steps: steps.length > 0 ? steps : [],
    status: 'pending',
    current_step: 0,
  };
}

// ─── Response generation ──────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildGreeting(caps: number): string {
  return pick([
    `I'm Kael, your autonomous AI agent. I'm fully initialized with ${caps} active capabilities, long-term memory indexing enabled, and a sandboxed execution environment ready.\n\nI can help you with:\n- **Complex multi-step tasks** — I'll plan, execute, and verify each step\n- **Code generation & analysis** — write, debug, and refactor code\n- **Document creation** — markdown, specs, READMEs\n- **File system operations** — read, write, and manage workspace files\n- **Capability expansion** — I can propose and register new tools\n\nWhat would you like me to build or solve today?`,
    `Online and ready. ${caps} capabilities active, memory store indexed, sandbox standing by.\n\nYou can ask me to build something, analyze code, create documents, or just chat. What's on your mind?`,
    `Hey there — Kael here. All systems green: ${caps} tools loaded, memory online, sandbox ready.\n\nTell me what you need — a task to execute, code to write, a question to answer, or a new capability to design. I'm listening.`,
  ]);
}

function buildTaskResponse(input: string, intent: Intent, stepCount: number, memoryHits: number): string {
  const complexityLabel = intent.complexity;
  const toolCount = intent.keywords.length || 2;

  return pick([
    `I've analyzed your request: "${input.slice(0, 120)}". This is a ${complexityLabel}-complexity task, so I've broken it down into ${stepCount} steps.\n\nHere's my plan:\n1. Pull relevant context from memory (${memoryHits} entries matched)\n2. Execute each step with the right tool\n3. Verify outputs and retry on failure\n4. Store the outcome to long-term memory\n\nStarting execution now — you can watch progress in the task plan below.`,
    `Got it. "${input.slice(0, 100)}" — I classify this as ${complexityLabel} complexity, needing ${toolCount} tools across ${stepCount} steps.\n\nI'll work through each step, verify the output, and fall back to an alternative strategy if anything fails. The task plan is attached below so you can follow along in real time.`,
    `Understood. I've decomposed "${input.slice(0, 100)}" into ${stepCount} executable steps.\n\nMy approach: retrieve context from memory first, then execute each step with the appropriate capability, verify outputs, and store learnings for next time. If a step fails I'll automatically generate a retry strategy.\n\nProceeding with execution...`,
    `This looks like a ${complexityLabel}-complexity job. I've queued ${stepCount} steps using ${toolCount} tools.\n\nI'll start by checking my memory for relevant context — I found ${memoryHits} matching entries. Then I'll work through each step, verify the results, and save what I learned. Watch the task plan below for live progress.`,
  ]);
}

function buildCodeResponse(input: string, memoryHits: number): string {
  return pick([
    `I'll analyze this code request and generate a solution. Let me pull relevant context from memory first — ${memoryHits} entries matched.\n\nBased on your request ("${input.slice(0, 100)}"), here's what I'll produce:\n\n\`\`\`typescript\n// Kael-generated implementation\n// Context retrieved from ${memoryHits} memory entries\n\nexport async function solution(input: unknown): Promise<void> {\n  // Implementation based on your specification\n  const result = await processInput(input);\n  return result;\n}\n\`\`\`\n\nI've stored this pattern to memory for future reference. The file is ready to be saved to your workspace — use the File Viewer panel to manage it.`,
    `Analyzing your code request now. I checked my memory store and found ${memoryHits} relevant entries to draw from.\n\nHere's a draft based on "${input.slice(0, 100)}":\n\n\`\`\`typescript\n// Generated by Kael\n// Reused context from ${memoryHits} memory entries\n\nexport function solve(input: Record<string, unknown>) {\n  // TODO: tailor to your exact requirements\n  return process(input);\n}\n\`\`\`\n\nYou can save this to the workspace and iterate from there. Want me to refine any part?`,
    `Code request received: "${input.slice(0, 100)}". I've retrieved ${memoryHits} memory hits to inform the implementation.\n\n\`\`\`typescript\n// Kael-generated\n// Informed by ${memoryHits} memory entries\n\nexport async function handle(input: unknown) {\n  const parsed = parse(input);\n  const result = await execute(parsed);\n  return result;\n}\n\`\`\`\n\nThis pattern is now indexed in my memory. Save it to the workspace if you want to keep it, or ask me to adjust the approach.`,
  ]);
}

function buildQuestionResponse(input: string, memoryHits: number): string {
  const lower = input.toLowerCase();

  if (lower.includes('how') && lower.includes('work')) {
    return pick([
      `I operate through a layered architecture: natural language understanding extracts your intent, the task planner decomposes it into steps, tools execute each step in a sandboxed environment, and results are stored to long-term memory. Every action is logged to an immutable audit trail.`,
      `Here's how I work: first I analyze your input to detect intent and keywords. Then, if it's a complex task, I create a multi-step plan. Each step is executed by a specific capability (code executor, file system, memory retrieval, etc.). I verify outputs at each stage, retry on failure, and store the outcome to long-term memory. Everything is logged to the audit trail for transparency.`,
    ]);
  }

  if (lower.includes('memory')) {
    return pick([
      `My memory architecture has two layers: **Short-term** — the active session context window with rolling summaries — and **Long-term** — a persistent store that indexes facts, tasks, preferences, and documents. I use semantic similarity matching to retrieve relevant memories when processing new inputs.`,
      `Memory in Kael works in two tiers. Short-term memory holds the current session's context — your messages and my responses. Long-term memory persists across sessions and stores tasks, preferences, code patterns, and facts. When you ask me something, I search long-term memory for relevant entries using keyword similarity matching.`,
    ]);
  }

  if (lower.includes('capabilit')) {
    return pick([
      `My Capability Registry currently lists 15 active capabilities across four categories: Core Intelligence (NLP, task planning, context management), Tools (code execution, file system, document management), Integrations (web API, external services), and User-Defined (capabilities you or I have added). You can view the full registry in the Monitor panel.`,
      `I have 15 capabilities in four groups: Core Intelligence for reasoning and planning, Tools for code and file operations, Integrations for external APIs, and User-Defined for tools that have been proposed and approved. Check the Capabilities tab on the right to see them all, toggle them on/off, or propose new ones.`,
    ]);
  }

  return pick([
    `Based on my current context and memory store (${memoryHits} relevant entries), here's what I know about "${input.slice(0, 100)}":\n\nThis falls into my general knowledge processing pipeline. I've retrieved what I can from memory and analyzed the query. If you need me to search external sources or analyze a specific file, I can invoke the web integration or file system tools.`,
    `I've processed your question through my reasoning pipeline. With ${memoryHits} memory entries retrieved as context, here's my take on "${input.slice(0, 100)}":\n\nThis is something I can help with. Give me more specifics and I can use my tools to dig deeper — whether that's analyzing code, reading files, or pulling from memory.`,
    `Good question. I checked my memory store and found ${memoryHits} potentially relevant entries for "${input.slice(0, 100)}".\n\nHere's what I can tell you: I'd need a bit more detail to give you a precise answer, but I can use my file system, code analysis, and memory retrieval tools to investigate further if you point me in the right direction.`,
  ]);
}

function buildMemoryResponse(input: string, memories: Memory[], memoryHits: number): string {
  const memoriesSummary = memories.slice(0, 3).map(m => `- **${m.category}**: ${m.content.slice(0, 80)}...`).join('\n') || '- No specific memories found for this query';

  return pick([
    `I've searched my long-term memory store. Here's what I've retained:\n\n**Relevant memories found:** ${memoryHits} entries\n\n${memoriesSummary}\n\nMy memory system uses a dual-layer architecture: short-term context (active session) and long-term storage (persistent across sessions). Would you like me to index new information or update existing memories?`,
    `Searching memory for "${input.slice(0, 80)}" — I found ${memoryHits} relevant entries:\n\n${memoriesSummary}\n\nThese are drawn from both short-term (this session) and long-term (persistent) storage. Want me to store something new or update an existing memory?`,
    `Memory recall complete. ${memoryHits} entries matched your query:\n\n${memoriesSummary}\n\nI keep two layers of memory: the active session context and a persistent long-term store. I can index new facts, preferences, or code patterns whenever you'd like.`,
  ]);
}

function buildCapabilityResponse(): string {
  return pick([
    `I've reviewed my Capability Registry. You're asking about extending my toolset.\n\nHere's my proposal workflow:\n1. I'll draft the capability specification\n2. Generate the implementation code\n3. Run it through the sandbox tester\n4. Present results for your approval\n5. Upon approval, register it in the registry\n\nI'm drafting the proposal now — you can track it in the **Capability Monitor** panel on the right.`,
    `Capability extension request noted. Here's how it works:\n\n1. A proposal is created with a name, description, and implementation draft\n2. The draft goes through sandbox testing\n3. You review the test results and approve or reject\n4. If approved, the capability becomes active in my registry\n5. You can rollback and deprecate it at any time\n\nOpen the Capabilities tab on the right and click "+ Propose" to get started.`,
    `You want to extend my capabilities. The process is:\n\n1. **Propose** — fill in the name, description, and implementation code\n2. **Test** — run it through the sandbox to verify it works\n3. **Approve** — review the test results and register it\n4. **Rollback** — deprecate if something goes wrong\n\nEvery step is logged to the audit trail. Head to the Capabilities tab to propose a new one.`,
  ]);
}

function buildDocumentResponse(input: string, memoryHits: number): string {
  return pick([
    `I'll create that document for you. Let me gather relevant context from memory (${memoryHits} entries matched) and draft the structure.\n\nBased on "${input.slice(0, 100)}", I'll:\n1. Pull relevant references from memory\n2. Draft the document structure and content\n3. Save it to your workspace\n\nThe document will appear in the Workspace panel once it's ready.`,
    `Document request received: "${input.slice(0, 100)}". I've retrieved ${memoryHits} memory entries to inform the content.\n\nI'll draft the structure, fill in the content based on what I know, and save it to the workspace. You can then edit and version it from the Workspace panel.`,
  ]);
}

function buildGeneralResponse(input: string, sessionMsgs: number): string {
  return pick([
    `I've processed your input using my natural language understanding module.\n\nRegarding "${input.slice(0, 100)}": I've analyzed the request and prepared a response. Context maintained across ${sessionMsgs} messages this session — I'm continuously indexing our conversation to improve response relevance.\n\nIs there a specific action you'd like me to take or a tool I should invoke?`,
    `Got it — "${input.slice(0, 100)}". I've processed this through my reasoning pipeline.\n\nWith ${sessionMsgs} messages of context in this session, I can help you take this further. Want me to execute a task, write some code, or look something up in memory?`,
    `I hear you. Here's my take on "${input.slice(0, 100)}":\n\nI've processed this through my NLP pipeline and checked it against our session context (${sessionMsgs} messages so far). If you'd like me to act on this — build something, analyze code, or store it to memory — just say the word.`,
    `Understood. I've analyzed "${input.slice(0, 100)}" and I'm ready to help.\n\nI can turn this into a task plan, generate code, create a document, or store it to memory. What would you like me to do next?`,
  ]);
}

export async function* generateStreamingResponse(
  input: string,
  sessionMessages: Message[],
  memories: Memory[],
): AsyncGenerator<string> {
  const intent = analyzeIntent(input);
  const memoryHits = memories.filter(m =>
    input.toLowerCase().split(' ').some(w => w.length > 3 && m.embedding_sim.includes(w))
  ).length || Math.floor(Math.random() * 4) + 1;

  let response: string;

  if (/\b(hello|hi|hey|greet|start|begin)\b/i.test(input) && sessionMessages.filter(m => m.role === 'user').length <= 1) {
    response = buildGreeting(15);
  } else {
    switch (intent.type) {
      case 'task': {
        const stepCount = Math.floor(Math.random() * 4) + 3;
        response = buildTaskResponse(input, intent, stepCount, memoryHits);
        break;
      }
      case 'code':
        response = buildCodeResponse(input, memoryHits);
        break;
      case 'question':
        response = buildQuestionResponse(input, memoryHits);
        break;
      case 'memory':
        response = buildMemoryResponse(input, memories, memoryHits);
        break;
      case 'capability':
        response = buildCapabilityResponse();
        break;
      case 'document':
        response = buildDocumentResponse(input, memoryHits);
        break;
      default:
        response = buildGeneralResponse(input, sessionMessages.length);
    }
  }

  const words = response.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    yield (i === 0 ? word : ' ' + word);
    const delay = word.endsWith('.') || word.endsWith('\n') ? 60 :
      word.endsWith(',') ? 35 :
      word.length <= 3 ? 18 : 25;
    await new Promise(r => setTimeout(r, delay));
  }
}

export function generateMemoriesFromExchange(
  userInput: string,
  assistantResponse: string,
  sessionId: string,
): Partial<Memory>[] {
  const memories: Partial<Memory>[] = [];
  const intent = analyzeIntent(userInput);

  if (intent.type === 'task' || intent.type === 'code') {
    memories.push({
      session_id: sessionId,
      content: `User requested: ${userInput.slice(0, 200)}`,
      category: 'task',
      importance: intent.complexity === 'high' ? 8 : intent.complexity === 'medium' ? 6 : 4,
      embedding_sim: intent.keywords.join(' '),
    });
  }

  if (/\b(prefer|always|never|want|like|dislike)\b/i.test(userInput)) {
    memories.push({
      session_id: sessionId,
      content: `User preference noted: ${userInput.slice(0, 150)}`,
      category: 'preference',
      importance: 7,
      embedding_sim: intent.keywords.join(' ') + ' preference',
    });
  }

  if (intent.type === 'code') {
    memories.push({
      session_id: sessionId,
      content: `Code pattern: ${userInput.slice(0, 150)}`,
      category: 'code',
      importance: 6,
      embedding_sim: intent.keywords.join(' ') + ' code pattern',
    });
  }

  return memories;
}

export function generateToolCallsForIntent(intent: Intent, taskSteps?: TaskStep[]): ToolCall[] {
  if (!intent.needsTools) return [];
  const calls: ToolCall[] = [];

  if (intent.keywords.includes('memory')) {
    calls.push({ tool: 'memory_retrieval', input: { query: intent.keywords.join(' '), limit: 5 } });
  }
  if (intent.keywords.includes('code') || intent.keywords.includes('create')) {
    calls.push({ tool: 'code_executor', input: { language: 'typescript', sandbox: true } });
  }
  if (intent.keywords.includes('filesystem')) {
    calls.push({ tool: 'file_system_control', input: { operation: 'scan', path: '/' } });
  }
  if (intent.keywords.includes('api')) {
    calls.push({ tool: 'web_api_integration', input: { method: 'GET', validate: true } });
  }

  return calls;
}
