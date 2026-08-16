import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task, TaskStep, TaskStatus } from '@/types';
import { logAudit } from '@/lib/audit';

export function useTasks(sessionId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!sessionId) { setTasks([]); setLoading(false); return; }
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });
    if (data) setTasks(data as Task[]);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = useCallback(async (task: Partial<Task>): Promise<Task | null> => {
    if (!sessionId) return null;
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, session_id: sessionId })
      .select()
      .single();
    if (error || !data) return null;
    const t = data as Task;
    setTasks(prev => [t, ...prev]);
    await logAudit('task_created', 'kael', 'task', { title: t.title, steps: t.steps.length }, 'low', t.id);
    return t;
  }, [sessionId]);

  const updateTaskStep = useCallback(async (
    taskId: string,
    stepIndex: number,
    update: Partial<TaskStep>,
  ) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const steps = t.steps.map((s, i) => i === stepIndex ? { ...s, ...update } : s);
      return { ...t, steps, current_step: stepIndex, updated_at: new Date().toISOString() };
    }));

    const task = (await supabase.from('tasks').select('steps').eq('id', taskId).maybeSingle()).data as Task | null;
    if (!task) return;
    const steps = task.steps.map((s: TaskStep, i: number) => i === stepIndex ? { ...s, ...update } : s);
    await supabase.from('tasks').update({ steps, current_step: stepIndex, updated_at: new Date().toISOString() }).eq('id', taskId);
  }, []);

  const setTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  }, []);

  const executeTask = useCallback(async (task: Task) => {
    setExecutingTaskId(task.id);
    await setTaskStatus(task.id, 'running');
    await logAudit('task_execution_started', 'kael', 'task', { title: task.title }, 'medium', task.id);

    for (let i = 0; i < task.steps.length; i++) {
      const step = task.steps[i];
      await updateTaskStep(task.id, i, { status: 'running' });
      // Simulate tool execution time
      const delay = 800 + Math.random() * 1200;
      await new Promise(r => setTimeout(r, delay));

      // Simulate occasional error and recovery
      const shouldFail = Math.random() < 0.08;
      if (shouldFail && i < task.steps.length - 1) {
        await updateTaskStep(task.id, i, {
          status: 'failed',
          error: 'Execution error detected — applying alternative strategy',
        });
        await new Promise(r => setTimeout(r, 600));
        await updateTaskStep(task.id, i, {
          status: 'completed',
          result: 'Recovered via fallback strategy — output verified',
        });
      } else {
        const results = [
          'Completed successfully — output verified',
          'Step executed — results stored to memory',
          'Tool returned expected output — proceeding',
          'Analysis complete — context updated',
          'Data processed and indexed',
        ];
        await updateTaskStep(task.id, i, {
          status: 'completed',
          result: results[Math.floor(Math.random() * results.length)],
        });
      }
    }

    await setTaskStatus(task.id, 'completed');
    setExecutingTaskId(null);
    await logAudit('task_execution_completed', 'kael', 'task', { title: task.title, steps: task.steps.length }, 'low', task.id);
  }, [setTaskStatus, updateTaskStep]);

  const cancelTask = useCallback(async (taskId: string) => {
    await setTaskStatus(taskId, 'cancelled');
    setExecutingTaskId(null);
    await logAudit('task_cancelled', 'user', 'task', {}, 'medium', taskId);
  }, [setTaskStatus]);

  return { tasks, loading, executingTaskId, createTask, updateTaskStep, setTaskStatus, executeTask, cancelTask, refetch: fetchTasks };
}
