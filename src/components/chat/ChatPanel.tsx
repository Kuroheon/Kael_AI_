import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Square, Paperclip, Sparkles, MemoryStick,
  Terminal, Brain, ChevronDown,
} from 'lucide-react';
import type { Session, Task } from '@/types';
import { MessageBubble } from './MessageBubble';
import { StreamingMessage } from './StreamingMessage';
import { TaskPlanViewer } from './TaskPlanViewer';
import { useMessages } from '@/hooks/useMessages';
import { useMemory } from '@/hooks/useMemory';
import { useTasks } from '@/hooks/useTasks';
import {
  generateStreamingResponse,
  generateMemoriesFromExchange,
  generateToolCallsForIntent,
  analyzeIntent,
  generateTaskPlan,
} from '@/lib/agent';

interface ChatPanelProps {
  session: Session | null;
  onSessionTitleUpdate: (id: string, title: string) => void;
}

export function ChatPanel({ session, onSessionTitleUpdate }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamBufferRef = useRef('');

  const {
    messages, streamingContent, isStreaming,
    addMessage, startStreaming, appendToken, finishStreaming, abortStreaming,
  } = useMessages(session?.id ?? null);

  const { memories, addMemories, retrieveRelevant } = useMemory();
  const { tasks, executingTaskId, createTask, executeTask, cancelTask } = useTasks(session?.id ?? null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isStreaming || messages.length > 0) scrollToBottom();
  }, [messages.length, isStreaming, streamingContent, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setShowScrollBtn(!atBottom);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session || isProcessing) return;
    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    // Update session title from first message
    if (messages.length === 0) {
      const title = userInput.length > 40 ? userInput.slice(0, 37) + '...' : userInput;
      onSessionTitleUpdate(session.id, title);
    }

    // Save user message
    await addMessage('user', userInput);

    // Analyze intent
    const intent = analyzeIntent(userInput);
    const relevantMemories = retrieveRelevant(userInput, 5);

    // Create task if needed
    let task: Task | null = null;
    if (intent.type === 'task' || intent.complexity === 'high' || intent.keywords.includes('plan')) {
      const taskPlan = generateTaskPlan(userInput, intent);
      if (taskPlan.steps && taskPlan.steps.length > 0) {
        task = await createTask({ ...taskPlan, session_id: session.id });
      }
    }

    // Stream assistant response
    startStreaming();
    streamBufferRef.current = '';

    const toolCalls = generateToolCallsForIntent(intent);

    try {
      for await (const token of generateStreamingResponse(userInput, messages, relevantMemories)) {
        streamBufferRef.current += token;
        appendToken(token);
      }

      const finalContent = streamBufferRef.current;
      await finishStreaming(finalContent, toolCalls, { model: 'kael-core-v2' });

      // Store memories from exchange
      const newMemories = generateMemoriesFromExchange(userInput, finalContent, session.id);
      if (newMemories.length > 0) await addMemories(newMemories);

      // Auto-execute task if created
      if (task) {
        setTimeout(() => executeTask(task!), 800);
      }
    } catch {
      abortStreaming();
    }

    setIsProcessing(false);
  }, [input, session, isProcessing, messages, addMessage, startStreaming, appendToken,
    finishStreaming, abortStreaming, retrieveRelevant, addMemories, createTask, executeTask,
    onSessionTitleUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAbort = () => {
    abortStreaming();
    setIsProcessing(false);
  };

  const sessionTasks = tasks.filter(t => t.session_id === session?.id);

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-cyan-500" />
          <span className="text-xs font-mono font-semibold text-neutral-300">EXECUTION CONSOLE</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-neutral-600 font-mono">
          <span className="flex items-center gap-1"><Brain size={10} className="text-violet-500" />{memories.length} memories</span>
          <span className="flex items-center gap-1"><Sparkles size={10} className="text-cyan-500" />{messages.length} msgs</span>
        </div>
      </div>

      {!session ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Brain size={40} className="text-neutral-700 mx-auto" />
            <p className="text-sm text-neutral-600 font-mono">Create or select a session to begin</p>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
          >
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center">
                    <Brain size={28} className="text-cyan-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-semibold text-neutral-300 font-mono">Kael is ready</p>
                  <p className="text-xs text-neutral-600 max-w-64 text-center">
                    Describe a task, ask a question, or say hello to get started.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 w-full max-w-sm">
                  {[
                    'Build a REST API endpoint',
                    'Analyze my codebase structure',
                    'Create a project specification',
                    'Propose a new capability',
                  ].map(prompt => (
                    <button
                      key={prompt}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-2 text-xs text-neutral-400 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg font-mono text-left transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message => (
              <React.Fragment key={message.id}>
                <MessageBubble message={message} />
                {/* Show task plans linked to this message position */}
                {message.role === 'assistant' && sessionTasks
                  .filter(t => {
                    const msgTime = new Date(message.created_at).getTime();
                    const taskTime = new Date(t.created_at).getTime();
                    return Math.abs(taskTime - msgTime) < 5000 && t.steps.length > 0;
                  })
                  .map(task => (
                    <TaskPlanViewer
                      key={task.id}
                      task={task}
                      onExecute={executeTask}
                      onCancel={cancelTask}
                      isExecuting={executingTaskId === task.id}
                    />
                  ))
                }
              </React.Fragment>
            ))}

            {isStreaming && <StreamingMessage content={streamingContent} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 right-6 p-2 rounded-full bg-neutral-800 border border-neutral-700 shadow-lg hover:bg-neutral-700 transition-colors"
            >
              <ChevronDown size={14} className="text-neutral-300" />
            </button>
          )}

          {/* Input */}
          <div className="border-t border-neutral-800 p-3 shrink-0">
            <div className="flex gap-2 items-end">
              <div className="flex-1 bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden focus-within:border-cyan-700 transition-colors">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe a task or ask Kael anything... (Enter to send, Shift+Enter for newline)"
                  className="w-full bg-transparent px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 resize-none outline-none font-mono leading-relaxed min-h-[52px] max-h-32"
                  rows={1}
                  disabled={isProcessing}
                />
                <div className="flex items-center justify-between px-3 pb-2">
                  <div className="flex items-center gap-2">
                    <button className="text-neutral-600 hover:text-neutral-400 transition-colors p-1 rounded">
                      <Paperclip size={13} />
                    </button>
                    <button className="text-neutral-600 hover:text-cyan-400 transition-colors p-1 rounded">
                      <MemoryStick size={13} />
                    </button>
                  </div>
                  <span className="text-[10px] text-neutral-700 font-mono">
                    {input.length > 0 ? `${input.length} chars` : 'ctrl+k for commands'}
                  </span>
                </div>
              </div>
              <button
                onClick={isStreaming ? handleAbort : handleSend}
                disabled={!isStreaming && (!input.trim() || isProcessing)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                  isStreaming
                    ? 'bg-red-700 hover:bg-red-600 text-white'
                    : input.trim() && !isProcessing
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                    : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                {isStreaming ? <Square size={14} /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
