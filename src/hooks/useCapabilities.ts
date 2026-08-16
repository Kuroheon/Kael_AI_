import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Capability, CapabilityProposal, CapabilityStatus } from '@/types';
import { logAudit } from '@/lib/audit';

export function useCapabilities() {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [proposals, setProposals] = useState<CapabilityProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [capsRes, propsRes] = await Promise.all([
      supabase.from('capabilities').select('*').order('category').order('name'),
      supabase.from('capability_proposals').select('*').order('created_at', { ascending: false }),
    ]);
    if (capsRes.data) setCapabilities(capsRes.data as Capability[]);
    if (propsRes.data) setProposals(propsRes.data as CapabilityProposal[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateCapabilityStatus = useCallback(async (id: string, status: CapabilityStatus) => {
    await supabase.from('capabilities').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setCapabilities(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    await logAudit('capability_status_changed', 'user', 'capability', { status }, 'medium', id);
  }, []);

  const incrementUsage = useCallback(async (name: string) => {
    const cap = capabilities.find(c => c.name === name);
    if (!cap) return;
    const newCount = cap.usage_count + 1;
    await supabase.from('capabilities').update({ usage_count: newCount }).eq('name', name);
    setCapabilities(prev => prev.map(c => c.name === name ? { ...c, usage_count: newCount } : c));
  }, [capabilities]);

  const proposeCapability = useCallback(async (
    name: string,
    description: string,
    rationale: string,
    codeDraft: string,
    proposedBy: 'kael' | 'user' = 'user',
  ): Promise<CapabilityProposal | null> => {
    const { data, error } = await supabase
      .from('capability_proposals')
      .insert({ name, description, rationale, code_draft: codeDraft, proposed_by: proposedBy, status: 'draft' })
      .select()
      .single();
    if (error || !data) return null;
    const proposal = data as CapabilityProposal;
    setProposals(prev => [proposal, ...prev]);
    await logAudit('capability_proposed', proposedBy, 'capability_proposal', { name, description }, 'medium', proposal.id);
    return proposal;
  }, []);

  const runSandboxTest = useCallback(async (proposalId: string) => {
    await supabase.from('capability_proposals').update({ status: 'testing', updated_at: new Date().toISOString() }).eq('id', proposalId);
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'testing' } : p));

    // Simulate sandbox execution
    await new Promise(r => setTimeout(r, 2500));
    const passed = Math.random() > 0.2;
    const testResults = {
      passed,
      tests_run: 4,
      tests_passed: passed ? 4 : Math.floor(Math.random() * 3) + 1,
      duration_ms: Math.floor(Math.random() * 800) + 200,
      output: passed ? 'All assertions passed. No security violations detected.' : 'Assertion failed on test #3: unexpected return type',
      sandbox: 'isolated',
    };

    const newStatus = passed ? 'awaiting_approval' : 'draft';
    await supabase.from('capability_proposals').update({
      status: newStatus,
      test_results: testResults,
      updated_at: new Date().toISOString(),
    }).eq('id', proposalId);

    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: newStatus as CapabilityProposal['status'], test_results: testResults } : p));
    await logAudit('capability_sandbox_tested', 'kael', 'capability_proposal', testResults, passed ? 'medium' : 'high', proposalId);
    return testResults;
  }, []);

  const approveAndRegister = useCallback(async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    await supabase.from('capability_proposals').update({ status: 'registered', updated_at: new Date().toISOString() }).eq('id', proposalId);
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'registered' } : p));

    // Register as a real capability
    const { data } = await supabase.from('capabilities').insert({
      name: proposal.name.toLowerCase().replace(/\s+/g, '_'),
      description: proposal.description,
      category: 'user_defined',
      status: 'active',
      permissions: ['read', 'execute'],
      code_snippet: proposal.code_draft.slice(0, 200),
      version: '1.0.0',
    }).select().single();

    if (data) setCapabilities(prev => [...prev, data as Capability]);
    await logAudit('capability_registered', 'user', 'capability', { name: proposal.name }, 'high', data?.id, 'user');
  }, [proposals]);

  const rejectProposal = useCallback(async (proposalId: string) => {
    await supabase.from('capability_proposals').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', proposalId);
    setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected' } : p));
    await logAudit('capability_rejected', 'user', 'capability_proposal', {}, 'medium', proposalId);
  }, []);

  const rollbackCapability = useCallback(async (id: string) => {
    await supabase.from('capabilities').update({ status: 'deprecated', updated_at: new Date().toISOString() }).eq('id', id);
    setCapabilities(prev => prev.map(c => c.id === id ? { ...c, status: 'deprecated' } : c));
    await logAudit('capability_rolled_back', 'user', 'capability', {}, 'critical', id);
  }, []);

  return {
    capabilities,
    proposals,
    loading,
    updateCapabilityStatus,
    incrementUsage,
    proposeCapability,
    runSandboxTest,
    approveAndRegister,
    rejectProposal,
    rollbackCapability,
    refetch: fetchAll,
  };
}
