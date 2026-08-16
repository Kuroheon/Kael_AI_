import { supabase } from './supabase';
import type { RiskLevel } from '@/types';

export async function logAudit(
  action: string,
  actor: 'kael' | 'user' | 'system',
  targetType: string,
  details: Record<string, unknown>,
  riskLevel: RiskLevel = 'low',
  targetId?: string,
  approvedBy?: string,
) {
  await supabase.from('audit_logs').insert({
    action,
    actor,
    target_type: targetType,
    target_id: targetId ?? null,
    details,
    risk_level: riskLevel,
    approved_by: approvedBy ?? null,
  });
}
