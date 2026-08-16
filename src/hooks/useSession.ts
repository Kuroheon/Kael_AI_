import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@/types';

export function useSession() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) {
        console.warn('Failed to fetch sessions from Supabase:', error);
        setSessions(prev => prev);
      } else if (data) {
        setSessions(data as Session[]);
      }
    } catch (err) {
      console.warn('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(async (title = 'New Session') => {
    // Generate client-side id to avoid DB insert failures when the table requires a non-null id
    const newId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `local-${Date.now()}`;

    // Try to create on Supabase; if it fails, fall back to a local session so UI stays responsive
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ id: newId, title })
        .select()
        .single();

      if (error || !data) {
        console.warn('Supabase createSession failed, falling back to local session:', error);
        const fallback: Session = {
          id: newId,
          title,
          summary: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setSessions(prev => [fallback, ...prev]);
        setActiveSession(fallback);
        return fallback;
      }

      const session = data as Session;
      setSessions(prev => [session, ...prev]);
      setActiveSession(session);
      return session;
    } catch (err) {
      console.error('Error creating session:', err);
      const fallback: Session = {
        id: newId,
        title,
        summary: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSessions(prev => [fallback, ...prev]);
      setActiveSession(fallback);
      return fallback;
    }
  }, []);

  const updateSessionTitle = useCallback(async (id: string, title: string) => {
    try {
      await supabase
        .from('sessions')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to update session title on Supabase:', err);
    }
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s));
    setActiveSession(prev => prev?.id === id ? { ...prev, title } : prev);
  }, []);

  const updateSessionSummary = useCallback(async (id: string, summary: string) => {
    try {
      await supabase
        .from('sessions')
        .update({ summary, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed to update session summary on Supabase:', err);
    }
    setActiveSession(prev => prev?.id === id ? { ...prev, summary } : prev);
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    try {
      await supabase.from('sessions').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete session from Supabase, removing locally:', err);
    }
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
