import React from 'react';
import { Brain } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
}

function renderStreamingText(text: string): React.ReactNode {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-semibold text-neutral-100 leading-relaxed">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 text-sm text-neutral-300 leading-relaxed">
              <span className="text-cyan-500 shrink-0">▸</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        if (line === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-neutral-300 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-cyan-900 border border-cyan-700">
        <Brain size={14} className="text-cyan-400 animate-pulse" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-semibold text-neutral-500">Kael</span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        </div>
        <div className="rounded-xl px-4 py-3 bg-neutral-900 border border-neutral-800">
          {content ? renderStreamingText(content) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-500 font-mono italic">Processing...</span>
            </div>
          )}
          <span className="inline-block w-0.5 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
        </div>
      </div>
    </div>
  );
}
