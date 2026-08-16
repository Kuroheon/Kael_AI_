import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, FlaskConical, CheckCircle2,
  XCircle, Play, Clock,
} from 'lucide-react';
import type { CapabilityProposal } from '@/types';
import { Badge } from '@/components/shared/Badge';

interface ProposalCardProps {
  proposal: CapabilityProposal;
  onTest: (id: string) => Promise<unknown>;
  onApprove: (id: string) => Promise<unknown>;
  onReject: (id: string) => Promise<unknown>;
}

const statusConfig: Record<string, { badge: string; label: string }> = {
  draft: { badge: 'default', label: 'Draft' },
  testing: { badge: 'info', label: 'Testing...' },
  awaiting_approval: { badge: 'warning', label: 'Needs Approval' },
  approved: { badge: 'success', label: 'Approved' },
  rejected: { badge: 'error', label: 'Rejected' },
  registered: { badge: 'success', label: 'Registered' },
};

export function ProposalCard({ proposal, onTest, onApprove, onReject }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(proposal.status === 'awaiting_approval');
  const [testing, setTesting] = useState(false);
  const cfg = statusConfig[proposal.status] || statusConfig.draft;

  const handleTest = async () => {
    setTesting(true);
    await onTest(proposal.id);
    setTesting(false);
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${
      proposal.status === 'awaiting_approval' ? 'border-amber-700/50 bg-amber-950/10' : 'border-neutral-700 bg-neutral-900/30'
    }`}>
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-neutral-800/30 transition-colors"
        onClick={() => setExpanded(o => !o)}
      >
        <FlaskConical size={12} className="text-violet-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-mono text-neutral-200 truncate">{proposal.name}</span>
            <Badge variant={cfg.badge as 'default' | 'success' | 'warning' | 'error' | 'info'} size="sm">
              {testing ? 'Testing...' : cfg.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] text-neutral-700 font-mono">{proposal.proposed_by}</span>
          {expanded ? <ChevronDown size={11} className="text-neutral-600" /> : <ChevronRight size={11} className="text-neutral-600" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-800 px-3 py-3 space-y-3">
          <p className="text-xs text-neutral-400">{proposal.description}</p>
          {proposal.rationale && (
            <p className="text-xs text-neutral-600 italic">Rationale: {proposal.rationale}</p>
          )}

          {/* Test results */}
          {proposal.test_results && (
            <div className={`rounded-lg p-2.5 border text-xs font-mono ${
              (proposal.test_results as any).passed
                ? 'bg-emerald-950/30 border-emerald-800/50 text-emerald-400'
                : 'bg-red-950/30 border-red-800/50 text-red-400'
            }`}>
              <div className="flex items-center gap-1.5 mb-1">
                {(proposal.test_results as any).passed
                  ? <CheckCircle2 size={12} />
                  : <XCircle size={12} />
                }
                <span>{(proposal.test_results as any).passed ? 'Tests Passed' : 'Tests Failed'}</span>
                <span className="text-[10px] text-neutral-600 ml-auto">
                  {(proposal.test_results as any).tests_passed}/{(proposal.test_results as any).tests_run} tests
                  · {(proposal.test_results as any).duration_ms}ms
                </span>
              </div>
              <p className="text-[10px] opacity-80">{(proposal.test_results as any).output}</p>
            </div>
          )}

          {/* Code preview */}
          {proposal.code_draft && (
            <pre className="text-[10px] font-mono text-neutral-500 bg-neutral-950 rounded px-2 py-2 overflow-x-auto border border-neutral-800 max-h-28">
              {proposal.code_draft.slice(0, 300)}{proposal.code_draft.length > 300 ? '\n...' : ''}
            </pre>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {proposal.status === 'draft' && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-violet-900/50 hover:bg-violet-800/50 border border-violet-700/50 text-violet-300 rounded-lg transition-colors disabled:opacity-50"
              >
                <FlaskConical size={11} />
                {testing ? 'Running...' : 'Run Sandbox Test'}
              </button>
            )}
            {proposal.status === 'awaiting_approval' && (
              <>
                <button
                  onClick={() => onApprove(proposal.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-emerald-900/50 hover:bg-emerald-800/50 border border-emerald-700/50 text-emerald-300 rounded-lg transition-colors"
                >
                  <CheckCircle2 size={11} />Approve & Register
                </button>
                <button
                  onClick={() => onReject(proposal.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-red-400 rounded-lg transition-colors"
                >
                  <XCircle size={11} />Reject
                </button>
              </>
            )}
            {proposal.status === 'registered' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono">
                <CheckCircle2 size={10} />Registered in capability registry
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-700 font-mono flex items-center gap-1">
            <Clock size={9} />{new Date(proposal.created_at).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
