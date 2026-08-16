import React, { useState } from 'react';
import { Brain, User, Wrench, Copy, Check, ChevronDown, ChevronRight } from 'lucide-react';
import type { Message } from '@/types';
import { Badge } from '@/components/shared/Badge';

interface MessageBubbleProps {
  message: Message;
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <CodeBlock key={key++} code={codeLines.join('\n')} lang={lang} />
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      elements.push(<h4 key={key++} className="text-sm font-semibold text-neutral-200 mt-3 mb-1 font-mono">{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={key++} className="text-sm font-bold text-neutral-100 mt-3 mb-1 font-mono">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={key++} className="text-base font-bold text-neutral-100 mt-3 mb-1 font-mono">{line.slice(2)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={key++} className="flex gap-2 text-sm text-neutral-300 leading-relaxed">
          <span className="text-cyan-500 shrink-0 mt-0.5">▸</span>
          <span>{inlineMarkdown(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 text-sm text-neutral-300 leading-relaxed">
          <span className="text-cyan-500 shrink-0 font-mono text-xs mt-0.5">{num}.</span>
          <span>{inlineMarkdown(line.replace(/^\d+\. /, ''))}</span>
        </div>
      );
    } else if (line === '') {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-neutral-300 leading-relaxed">{inlineMarkdown(line)}</p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-neutral-100">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 bg-neutral-800 rounded text-cyan-300 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="italic text-neutral-200">{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 rounded-lg overflow-hidden border border-neutral-700">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-800 border-b border-neutral-700">
        <span className="text-xs text-neutral-400 font-mono">{lang || 'code'}</span>
        <button onClick={copy} className="text-neutral-500 hover:text-neutral-200 transition-colors p-0.5 rounded">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        </button>
      </div>
      <pre className="p-3 text-xs font-mono text-neutral-300 overflow-x-auto bg-neutral-950 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-neutral-700' : isAssistant ? 'bg-cyan-900 border border-cyan-700' : 'bg-neutral-800'
      }`}>
        {isUser ? (
          <User size={14} className="text-neutral-300" />
        ) : isAssistant ? (
          <Brain size={14} className="text-cyan-400" />
        ) : (
          <Wrench size={14} className="text-neutral-400" />
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 max-w-2xl ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-mono font-semibold text-neutral-500">
            {isUser ? 'You' : isAssistant ? 'Kael' : 'Tool'}
          </span>
          {isAssistant && !!message.metadata?.model && (
            <Badge variant="info" size="sm">{String(message.metadata.model)}</Badge>
          )}
          <span className="text-[10px] text-neutral-700 font-mono">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {message.tokens > 0 && (
            <span className="text-[10px] text-neutral-700 font-mono">{message.tokens}t</span>
          )}
        </div>

        <div className={`rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-neutral-800 border border-neutral-700 text-neutral-200'
            : 'bg-neutral-900 border border-neutral-800'
        }`}>
          {isUser ? (
            <p className="text-sm text-neutral-200 leading-relaxed">{message.content}</p>
          ) : (
            renderMarkdown(message.content)
          )}
        </div>

        {/* Tool calls */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-1.5 w-full">
            <button
              onClick={() => setToolsOpen(o => !o)}
              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 font-mono transition-colors"
            >
              <Wrench size={10} />
              {message.tool_calls.length} tool call{message.tool_calls.length > 1 ? 's' : ''}
              {toolsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
            {toolsOpen && (
              <div className="mt-1.5 space-y-1">
                {message.tool_calls.map((tc, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs font-mono">
                    <Wrench size={10} className="text-cyan-500 shrink-0" />
                    <span className="text-cyan-400">{tc.tool}</span>
                    <Badge variant={tc.status === 'success' ? 'success' : tc.status === 'error' ? 'error' : 'default'} size="sm">
                      {tc.status || 'called'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
