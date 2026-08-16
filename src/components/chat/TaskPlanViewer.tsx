import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Play, X, CheckCircle2,
  Circle, AlertCircle, Loader2, Wrench,
} from 'lucide-react';
import type { Task, TaskStep } from '@/types';
import { Badge } from '@/components/shared/Badge';

interface TaskPlanViewerProps {
  task: Task;
  onExecute: (task: Task) => void;
  onCancel: (taskId: string) => void;
  isExecuting: boolean;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  pending: { icon: Circle, color: 'text-neutral-500', badge: 'default' },
  running: { icon: Loader2, color: 'text-cyan-400', badge: 'info' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'success' },
  failed: { icon: AlertCircle, color: 'text-red-400', badge: 'error' },
  cancelled: { icon: X, color: 'text-neutral-600', badge: 'default' },
};

function StepRow({ step, index }: { step: TaskStep; index: number }) {
  const cfg = statusConfig[step.status] || statusConfig.pending;
  const Icon = cfg.icon;
  const isRunning = step.status === 'running';

  return (
    <div className={`flex items-start gap-2.5 py-2 px-3 rounded-lg transition-colors ${
      isRunning ? 'bg-cyan-950/30 border border-cyan-900/50' : 'hover:bg-neutral-800/50'
    }`}>
      <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
        <span className="text-[10px] text-neutral-700 font-mono w-4 text-right">{index + 1}</span>
        <Icon size={13} className={`${cfg.color} ${isRunning ? 'animate-spin' : ''}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-mono ${step.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-300'}`}>
            {step.title}
          </span>
          {step.tool && (
            <span className="text-[10px] font-mono text-cyan-600 flex items-center gap-0.5">
              <Wrench size={9} />{step.tool}
            </span>
          )}
        </div>
        {step.result && (
          <p className="text-[10px] text-emerald-500 font-mono mt-0.5">{step.result}</p>
        )}
        {step.error && (
          <p className="text-[10px] text-amber-500 font-mono mt-0.5">{step.error}</p>
        )}
      </div>
    </div>
  );
}

export function TaskPlanViewer({ task, onExecute, onCancel, isExecuting }: TaskPlanViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const completedSteps = task.steps.filter(s => s.status === 'completed').length;
  const progress = task.steps.length > 0 ? (completedSteps / task.steps.length) * 100 : 0;

  const taskStatusCfg = statusConfig[task.status] || statusConfig.pending;
  const TaskStatusIcon = taskStatusCfg.icon;

  return (
    <div className="border border-neutral-700 rounded-xl overflow-hidden bg-neutral-900/50">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => setExpanded(o => !o)}
      >
        <TaskStatusIcon size={14} className={`${taskStatusCfg.color} shrink-0 ${task.status === 'running' ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-200 font-mono truncate">{task.title}</span>
            <Badge variant={taskStatusCfg.badge as 'default' | 'success' | 'warning' | 'error' | 'info'} size="sm">
              {task.status}
            </Badge>
          </div>
          {task.steps.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                {completedSteps}/{task.steps.length}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {task.status === 'pending' && !isExecuting && (
            <button
              onClick={e => { e.stopPropagation(); onExecute(task); }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-mono transition-colors"
            >
              <Play size={10} />Run
            </button>
          )}
          {task.status === 'running' && (
            <button
              onClick={e => { e.stopPropagation(); onCancel(task.id); }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-800 hover:bg-red-700 text-white text-xs font-mono transition-colors"
            >
              <X size={10} />Stop
            </button>
          )}
          {expanded ? <ChevronDown size={13} className="text-neutral-600" /> : <ChevronRight size={13} className="text-neutral-600" />}
        </div>
      </div>

      {/* Steps */}
      {expanded && task.steps.length > 0 && (
        <div className="border-t border-neutral-800 divide-y divide-neutral-800/50">
          {task.steps.map((step, i) => (
            <StepRow key={step.id} step={step} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
