import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Memory } from '@/types';

export function useMemory() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) setMemories(data as Memory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const addMemory = useCallback(async (memory: Partial<Memory>): Promise<Memory | null> => {
    const { data, error } = await supabase
      .from('memories')
      .insert(memory)
      .select()
      .single();
    if (error || !data) return null;
    const m = data as Memory;
    setMemories(prev => [m, ...prev]);
    return m;
  }, []);

  const addMemories = useCallback(async (newMemories: Partial<Memory>[]) => {
    if (newMemories.length === 0) return;
    const { data } = await supabase
      .from('memories')
      .insert(newMemories)
      .select();
    if (data) setMemories(prev => [...(data as Memory[]), ...prev]);
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  const retrieveRelevant = useCallback((query: string, limit = 5): Memory[] => {
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 3);
    const scored = memories.map(m => {
      const simWords = m.embedding_sim.toLowerCase().split(' ');
      const contentWords = m.content.toLowerCase().split(' ');
      const score = queryWords.reduce((acc, w) => {
        if (simWords.some(s => s.includes(w))) acc += 2;
        if (contentWords.some(c => c.includes(w))) acc += 1;
        return acc;
      }, 0) * m.importance;
      return { memory: m, score };
    });
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory);
  }, [memories]);

  return { memories, loading, addMemory, addMemories, deleteMemory, retrieveRelevant, refetch: fetchMemories };
}
