import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Document, DocLanguage } from '@/types';
import { logAudit } from '@/lib/audit';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setDocuments(data as Document[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const createDocument = useCallback(async (
    title: string,
    content = '',
    language: DocLanguage = 'markdown',
    path = '/',
  ): Promise<Document | null> => {
    const { data, error } = await supabase
      .from('documents')
      .insert({ title, content, language, path, version: 1, versions: [] })
      .select()
      .single();
    if (error || !data) return null;
    const doc = data as Document;
    setDocuments(prev => [doc, ...prev]);
    setActiveDocument(doc);
    await logAudit('document_created', 'user', 'document', { title, language }, 'low', doc.id);
    return doc;
  }, []);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    // Save current version to history before updating
    const current = documents.find(d => d.id === id);
    if (!current) return;

    const newVersion = current.version + 1;
    const versionSnapshot = {
      version: current.version,
      content: current.content,
      saved_at: new Date().toISOString(),
    };
    const versions = [...(current.versions || []), versionSnapshot].slice(-20);

    const finalUpdates = {
      ...updates,
      version: newVersion,
      versions,
      updated_at: new Date().toISOString(),
    };

    await supabase.from('documents').update(finalUpdates).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...finalUpdates } : d));
    setActiveDocument(prev => prev?.id === id ? { ...prev, ...finalUpdates } : prev);
  }, [documents]);

  const deleteDocument = useCallback(async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (activeDocument?.id === id) setActiveDocument(null);
    await logAudit('document_deleted', 'user', 'document', { id }, 'medium');
  }, [activeDocument]);

  const restoreVersion = useCallback(async (id: string, versionIndex: number) => {
    const doc = documents.find(d => d.id === id);
    if (!doc || !doc.versions[versionIndex]) return;
    const version = doc.versions[versionIndex];
    await updateDocument(id, { content: version.content });
    await logAudit('document_version_restored', 'user', 'document', { id, version: version.version }, 'medium');
  }, [documents, updateDocument]);

  return {
    documents,
    activeDocument,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
    restoreVersion,
    setActiveDocument,
    refetch: fetchDocuments,
  };
}
