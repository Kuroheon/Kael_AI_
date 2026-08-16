import React, { useState } from 'react';
import {
  Brain, Database, Wrench, Shield, FlaskConical,
  Plus, Trash2, Activity, ChevronDown, ChevronRight,
  AlertTriangle, Info, AlertCircle, Terminal,
} from 'lucide-react';
import type { Memory, RiskLevel } from '@/types';
import { useCapabilities } from '@/hooks/useCapabilities';
import { useMemory } from '@/hooks/useMemory';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { CapabilityCard } from './CapabilityCard';
import { ProposalCard } from './ProposalCard';
import { ProposeCapabilityModal } from './ProposeCapabilityModal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/shared/Badge';

type MonitorTab = 'capabilities' | 'memory' | 'audit';

const riskConfig: Record<RiskLevel, { icon: React.ElementType; color: string; badge: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  low: { icon: Info, color: 'text-neutral-500', badge: 'default' },
  medium: { icon: AlertTriangle, color: 'text-amber-500', badge: 'warning' },
  high: { icon: AlertCircle, color: 'text-orange-500', badge: 'error' },
  critical: { icon: Shield, color: 'text-red-500', badge: 'error' },
};

function MemoryRow({ memory, onDelete }: { memory: Memory; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const catColors: Record<string, string> = {
    fact: 'text-blue-400',
    task: 'text-cyan-400',
    preference: 'text-violet-400',
    document: 'text-amber-400',
    code: 'text-green-400',
    context: 'text-neutral-400',
  };

  return (
    <div className="border border-neutral-800 rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-neutral-800/50 transition-colors"
        onClick={() => setExpanded(o => !o)}
      >
        <Brain size={11} className={catColors[memory.category] || 'text-neutral-500'} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-neutral-300 font-mono truncate">{memory.content.slice(0, 80)}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-mono ${catColors[memory.category]}`}>{memory.category}</span>
          <span className="text-[10px] text-neutral-700 font-mono">imp:{memory.importance}</span>
          {expanded ? <ChevronDown size={10} className="text-neutral-700" /> : <ChevronRight size={10} className="text-neutral-700" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t border-neutral-800 px-2.5 py-2 space-y-1.5">
          <p className="text-xs text-neutral-400 font-mono leading-relaxed">{memory.content}</p>
          {memory.embedding_sim && (
            <p className="text-[10px] text-neutral-700 font-mono">tags: {memory.embedding_sim}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-700 font-mono">
              {new Date(memory.created_at).toLocaleString()}
            </span>
            <button
              onClick={() => onDelete(memory.id)}
              className="text-neutral-700 hover:text-red-400 transition-colors p-0.5 rounded"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MonitorPanel() {
  const [activeTab, setActiveTab] = useState<MonitorTab>('capabilities');
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [capFilter, setCapFilter] = useState<string>('all');
  const [memFilter, setMemFilter] = useState<string>('all');

  const {
    capabilities, proposals, loading: capLoading,
    updateCapabilityStatus, proposeCapability,
    runSandboxTest, approveAndRegister, rejectProposal, rollbackCapability,
  } = useCapabilities();

  const { memories, loading: memLoading, deleteMemory } = useMemory();
  const { logs, loading: logLoading } = useAuditLogs();

  const handleToggle = (id: string, active: boolean) => {
    updateCapabilityStatus(id, active ? 'active' : 'disabled');
  };

  const handlePropose = async (name: string, desc: string, rationale: string, code: string) => {
    await proposeCapability(name, desc, rationale, code, 'user');
  };

  const filteredCaps = capFilter === 'all'
    ? capabilities
    : capabilities.filter(c => c.category === capFilter);

  const filteredMems = memFilter === 'all'
    ? memories
    : memories.filter(m => m.category === memFilter);

  const activeCaps = capabilities.filter(c => c.status === 'active').length;
  const pendingProposals = proposals.filter(p => p.status === 'awaiting_approval').length;

  const tabs: { id: MonitorTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'capabilities', label: 'Capabilities', icon: Wrench, count: activeCaps },
    { id: 'memory', label: 'Memory', icon: Database, count: memories.length },
    { id: 'audit', label: 'Audit Trail', icon: Shield, count: logs.length },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-violet-400" />
          <span className="text-xs font-mono font-semibold text-neutral-300">KAEL STATE MONITOR</span>
        </div>
        {pendingProposals > 0 && (
          <Badge variant="warning" dot size="sm">{pendingProposals} pending approval</Badge>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-px border-b border-neutral-800 shrink-0 bg-neutral-800">
        {[
          { label: 'Active Caps', value: activeCaps, color: 'text-emerald-400', icon: Wrench },
          { label: 'Memories', value: memories.length, color: 'text-violet-400', icon: Brain },
          { label: 'Audit Events', value: logs.length, color: 'text-amber-400', icon: Shield },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-neutral-950 px-3 py-2.5 flex items-center gap-2">
            <Icon size={14} className={color} />
            <div>
              <p className={`text-base font-bold font-mono ${color}`}>{value}</p>
              <p className="text-[10px] text-neutral-600 font-mono">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 shrink-0">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono transition-colors border-b-2 ${
              activeTab === id
                ? 'text-cyan-400 border-cyan-500 bg-neutral-900/50'
                : 'text-neutral-600 border-transparent hover:text-neutral-400 hover:bg-neutral-900/30'
            }`}
          >
            <Icon size={11} />
            {label}
            {count !== undefined && (
              <span className={`text-[10px] px-1 rounded ${activeTab === id ? 'bg-cyan-900/50 text-cyan-400' : 'bg-neutral-800 text-neutral-600'}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* CAPABILITIES TAB */}
        {activeTab === 'capabilities' && (
          <div className="p-3 space-y-3">
            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(['all', 'core', 'tool', 'integration', 'user_defined'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setCapFilter(f)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      capFilter === f ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowProposeModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-violet-900/50 hover:bg-violet-800/50 border border-violet-700/50 text-violet-300 rounded-lg transition-colors"
              >
                <Plus size={11} />Propose
              </button>
            </div>

            {capLoading ? (
              <p className="text-xs text-neutral-700 font-mono">Loading capabilities...</p>
            ) : (
              <div className="space-y-1.5">
                {filteredCaps.map(cap => (
                  <CapabilityCard
                    key={cap.id}
                    capability={cap}
                    onToggle={handleToggle}
                    onRollback={id => setRollbackId(id)}
                  />
                ))}
              </div>
            )}

            {/* Proposals */}
            {proposals.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-neutral-800">
                <div className="flex items-center gap-1.5 px-1">
                  <FlaskConical size={12} className="text-violet-400" />
                  <span className="text-xs font-mono font-semibold text-neutral-500">PROPOSALS</span>
                </div>
                {proposals.map(p => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    onTest={runSandboxTest}
                    onApprove={approveAndRegister}
                    onReject={rejectProposal}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEMORY TAB */}
        {activeTab === 'memory' && (
          <div className="p-3 space-y-3">
            <div className="flex gap-1 flex-wrap">
              {(['all', 'fact', 'task', 'preference', 'document', 'code', 'context'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMemFilter(f)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    memFilter === f ? 'bg-neutral-700 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {memLoading ? (
              <p className="text-xs text-neutral-700 font-mono">Loading memory...</p>
            ) : filteredMems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Brain size={28} className="text-neutral-700" />
                <p className="text-xs text-neutral-600 font-mono">No memories yet. Chat with Kael to build memory.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredMems.map(m => (
                  <MemoryRow key={m.id} memory={m} onDelete={deleteMemory} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && (
          <div className="p-3 space-y-1.5">
            {logLoading ? (
              <p className="text-xs text-neutral-700 font-mono">Loading audit trail...</p>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Shield size={28} className="text-neutral-700" />
                <p className="text-xs text-neutral-600 font-mono">No audit events yet</p>
              </div>
            ) : (
              logs.map(log => {
                const cfg = riskConfig[log.risk_level] || riskConfig.low;
                const RiskIcon = cfg.icon;
                return (
                  <div key={log.id} className="flex items-start gap-2 px-2.5 py-2 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors bg-neutral-900/30">
                    <RiskIcon size={12} className={`${cfg.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-neutral-300">{log.action}</span>
                        <Badge variant={cfg.badge} size="sm">{log.risk_level}</Badge>
                        <span className="text-[10px] text-neutral-600 font-mono">{log.actor}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-neutral-600 font-mono">{log.target_type}</span>
                        {log.approved_by && (
                          <span className="text-[10px] text-emerald-600 font-mono">approved by: {log.approved_by}</span>
                        )}
                        <span className="text-[10px] text-neutral-700 font-mono ml-auto">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <ProposeCapabilityModal
        open={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        onPropose={handlePropose}
      />

      <ConfirmDialog
        open={!!rollbackId}
        onClose={() => setRollbackId(null)}
        onConfirm={() => { if (rollbackId) rollbackCapability(rollbackId); }}
        title="Rollback Capability"
        message="This will deprecate the capability and revert to the previous stable state. Active sessions using this capability may be affected."
        confirmLabel="Rollback"
        variant="warning"
      />
    </div>
  );
}
