import React, { useState } from 'react';
import {
  MessageSquare, Plus, Trash2, ChevronRight, Clock,
  Settings, HelpCircle, GitBranch,
} from 'lucide-react';
import type { Session } from '@/types';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (session: Session) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  activePanel: 'chat' | 'workspace' | 'monitor';
  onPanelChange: (panel: 'chat' | 'workspace' | 'monitor') => void;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function Sidebar({
  sessions, activeSessionId, onSelectSession, onCreateSession, onDeleteSession,
  activePanel, onPanelChange,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="w-56 bg-neutral-950 border-r border-neutral-800 flex flex-col shrink-0">
      {/* New session button */}
      <div className="p-3 border-b border-neutral-800">
        <button
          onClick={onCreateSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-semibold transition-colors"
        >
          <Plus size={13} />
          New Session
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        <p className="text-xs text-neutral-600 font-mono uppercase tracking-wider px-2 py-1.5">Sessions</p>
        {sessions.length === 0 && (
          <p className="text-xs text-neutral-600 px-2 py-3 italic">No sessions yet</p>
        )}
        {sessions.map(session => (
          <div
            key={session.id}
            className={`group relative flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
              activeSessionId === session.id
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
            }`}
            onClick={() => onSelectSession(session)}
            onMouseEnter={() => setHoveredId(session.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <MessageSquare size={13} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono truncate">{session.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={9} className="text-neutral-600" />
                <span className="text-[10px] text-neutral-600">{formatTime(session.updated_at)}</span>
              </div>
            </div>
            {activeSessionId === session.id && <ChevronRight size={11} className="text-cyan-500 shrink-0" />}
            {hoveredId === session.id && activeSessionId !== session.id && (
              <button
                onClick={e => { e.stopPropagation(); onDeleteSession(session.id); }}
                className="absolute right-2 p-0.5 rounded text-neutral-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-neutral-800 p-2 space-y-0.5">
        <p className="text-xs text-neutral-600 font-mono uppercase tracking-wider px-2 py-1">Panels</p>
        {([
          { id: 'chat', label: 'Console', icon: MessageSquare },
          { id: 'workspace', label: 'Workspace', icon: GitBranch },
          { id: 'monitor', label: 'Monitor', icon: Settings },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onPanelChange(id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-mono transition-colors ${
              activePanel === id
                ? 'bg-neutral-800 text-cyan-400'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
