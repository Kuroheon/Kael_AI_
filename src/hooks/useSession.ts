import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types';

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setSessions(data as Session[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (title = 'New Session') => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ title })
      .select()
      .single();
    if (error || !data) return null;
    const session = data as Session;
    setSessions(prev => [session, ...prev]);
    setActiveSession(session);
    return session;
  }, []);

  const updateSessionTitle = useCallback(async (id: string, title: string) => {
    await supabase
      .from('sessions')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    setActiveSession(prev => prev?.id === id ? { ...prev, title } : prev);
  }, []);

  const updateSessionSummary = useCallback(async (id: string, summary: string) => {
    await supabase
      .from('sessions')
      .update({ summary, updated_at: new Date().toISOString() })
      .eq('id', id);
    setActiveSession(prev => prev?.id === id ? { ...prev, summary } : prev);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await supabase.from('sessions').delete().eq('id', id);
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSession?.id === id) setActiveSession(null);
  }, [activeSession]);

  const selectSession = useCallback((session: Session) => {
    setActiveSession(session);
  }, []);

  return {
    sessions,
    activeSession,
    loading,
    createSession,
    updateSessionTitle,
    updateSessionSummary,
    deleteSession,
    selectSession,
  };
}
