import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message, ToolCall } from '@/types';

export function useMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!sessionId) { setMessages([]); return; }
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as Message[]);
  }, [sessionId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const addMessage = useCallback(async (
    role: Message['role'],
    content: string,
    toolCalls: ToolCall[] = [],
    metadata: Record<string, unknown> = {},
  ): Promise<Message | null> => {
    if (!sessionId) return null;
    const tokens = Math.ceil(content.split(' ').length * 1.3);
    const { data, error } = await supabase
      .from('messages')
      .insert({ session_id: sessionId, role, content, tokens, tool_calls: toolCalls, metadata })
      .select()
      .single();
    if (error || !data) return null;
    const message = data as Message;
    setMessages(prev => [...prev, message]);
    return message;
  }, [sessionId]);

  const startStreaming = useCallback(() => {
    abortRef.current = false;
    setStreamingContent('');
    setIsStreaming(true);
  }, []);

  const appendToken = useCallback((token: string) => {
    if (abortRef.current) return;
    setStreamingContent(prev => prev + token);
  }, []);

  const finishStreaming = useCallback(async (
    finalContent: string,
    toolCalls: ToolCall[] = [],
    metadata: Record<string, unknown> = {},
  ): Promise<Message | null> => {
    setIsStreaming(false);
    setStreamingContent('');
    abortRef.current = false;
    return addMessage('assistant', finalContent, toolCalls, metadata);
  }, [addMessage]);

  const abortStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    messages,
    streamingContent,
    isStreaming,
    addMessage,
    startStreaming,
    appendToken,
    finishStreaming,
    abortStreaming,
    clearMessages,
    refetch: fetchMessages,
  };
}
