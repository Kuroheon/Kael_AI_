import React from 'react';
import { Brain, Zap, Shield, Circle } from 'lucide-react';
import { Badge } from '@/components/shared/Badge';

interface HeaderProps {
  activeCapabilities: number;
  memoriesCount: number;
  activeSessionTitle: string | null;
}

export function Header({ activeCapabilities, memoriesCount, activeSessionTitle }: HeaderProps) {
  return (
    <header className="h-12 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Brain size={20} className="text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-bold text-neutral-100 font-mono tracking-wider">KAEL</span>
          <span className="text-xs text-neutral-500 font-mono">v2.1.0</span>
        </div>
        {activeSessionTitle && (
          <>
            <span className="text-neutral-700">/</span>
            <span className="text-xs text-neutral-400 font-mono truncate max-w-48">{activeSessionTitle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
          <Zap size={12} className="text-cyan-500" />
          <span>{activeCapabilities} capabilities</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
          <Brain size={12} className="text-violet-500" />
          <span>{memoriesCount} memories</span>
        </div>
        <Badge variant="success" dot>ONLINE</Badge>
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800">
          <Shield size={11} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-mono">SANDBOX ACTIVE</span>
        </div>
      </div>
    </header>
  );
}
