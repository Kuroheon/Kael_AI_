import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, ToggleLeft, ToggleRight, RotateCcw } from 'lucide-react';
import type { Capability } from '@/types';
import { Badge } from '@/components/shared/Badge';

interface CapabilityCardProps {
  capability: Capability;
  onToggle: (id: string, active: boolean) => void;
  onRollback: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  core: 'text-cyan-400',
  tool: 'text-amber-400',
  integration: 'text-violet-400',
  user_defined: 'text-emerald-400',
};

const statusVariants: Record<string, 'success' | 'warning' | 'error' | 'default' | 'info'> = {
  active: 'success',
  disabled: 'default',
  testing: 'info',
  deprecated: 'warning',
};

export function CapabilityCard({ capability, onToggle, onRollback }: CapabilityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isActive = capability.status === 'active';

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      isActive ? 'border-neutral-700 bg-neutral-900/50' : 'border-neutral-800 bg-neutral-950 opacity-60'
    }`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => setExpanded(o => !o)}
      >
        <Wrench size={12} className={categoryColors[capability.category] || 'text-neutral-500'} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-neutral-200 truncate">{capability.name}</span>
            <Badge variant={statusVariants[capability.status] || 'default'} size="sm">{capability.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-neutral-700 font-mono">{capability.usage_count} calls</span>
          <button
            onClick={e => { e.stopPropagation(); onToggle(capability.id, !isActive); }}
            className="text-neutral-600 hover:text-neutral-300 transition-colors"
            title={isActive ? 'Disable' : 'Enable'}
          >
            {isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
          </button>
          {expanded ? <ChevronDown size={11} className="text-neutral-600" /> : <ChevronRight size={11} className="text-neutral-600" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 px-3 py-2.5 space-y-2">
          <p className="text-xs text-neutral-400 leading-relaxed">{capability.description}</p>
          {capability.code_snippet && (
            <pre className="text-[10px] font-mono text-cyan-300 bg-neutral-950 rounded px-2 py-1.5 overflow-x-auto border border-neutral-800">
              {capability.code_snippet}
            </pre>
          )}
          <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-600">
            <span>v{capability.version}</span>
            <span className={categoryColors[capability.category]}>{capability.category}</span>
            {capability.permissions.length > 0 && (
              <span>perms: {capability.permissions.join(', ')}</span>
            )}
          </div>
          {capability.category === 'user_defined' && (
            <button
              onClick={() => onRollback(capability.id)}
              className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-400 font-mono transition-colors mt-1"
            >
              <RotateCcw size={10} />Rollback & Deprecate
            </button>
          )}
        </div>
      )}
    </div>
  );
}
