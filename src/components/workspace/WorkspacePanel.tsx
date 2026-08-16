import React, { useState } from 'react';
import {
  FolderOpen, FileText, Plus, Save, Trash2, RotateCcw,
  ChevronRight, ChevronDown, Code2, FileCode,
  History, GitBranch, Terminal,
} from 'lucide-react';
import type { Document, DocLanguage } from '@/types';
import { useDocuments } from '@/hooks/useDocuments';
import { Modal } from '@/components/shared/Modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Badge } from '@/components/shared/Badge';

const LANG_ICONS: Record<DocLanguage, React.ElementType> = {
  markdown: FileText,
  typescript: FileCode,
  javascript: FileCode,
  python: FileCode,
  json: Code2,
  yaml: Code2,
  plaintext: FileText,
  css: Code2,
  html: Code2,
};

const LANG_COLORS: Record<DocLanguage, string> = {
  markdown: 'text-blue-400',
  typescript: 'text-cyan-400',
  javascript: 'text-yellow-400',
  python: 'text-green-400',
  json: 'text-orange-400',
  yaml: 'text-purple-400',
  plaintext: 'text-neutral-400',
  css: 'text-pink-400',
  html: 'text-red-400',
};

function FileTree({
  documents,
  activeId,
  onSelect,
}: {
  documents: Document[];
  activeId: string | null;
  onSelect: (doc: Document) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '/': true });

  const byPath = documents.reduce<Record<string, Document[]>>((acc, doc) => {
    const key = doc.path || '/';
    if (!acc[key]) acc[key] = [];
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-0.5">
      {Object.entries(byPath).map(([path, docs]) => (
        <div key={path}>
          <button
            onClick={() => setExpanded(e => ({ ...e, [path]: !e[path] }))}
            className="w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 transition-colors font-mono"
          >
            <FolderOpen size={12} className="text-amber-500" />
            <span className="flex-1 text-left">{path === '/' ? 'workspace' : path}</span>
            {expanded[path] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
          {expanded[path] && docs.map(doc => {
            const Icon = LANG_ICONS[doc.language] || FileText;
            const color = LANG_COLORS[doc.language] || 'text-neutral-400';
            return (
              <button
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={`w-full flex items-center gap-2 pl-5 pr-2 py-1.5 rounded text-xs font-mono transition-colors ${
                  activeId === doc.id
                    ? 'bg-neutral-800 text-neutral-100'
                    : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
                }`}
              >
                <Icon size={11} className={color} />
                <span className="flex-1 text-left truncate">{doc.title}</span>
                {doc.version > 1 && (
                  <span className="text-[9px] text-neutral-700 font-mono">v{doc.version}</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function VersionHistory({ doc, onRestore }: { doc: Document; onRestore: (i: number) => void }) {
  if (doc.versions.length === 0) {
    return <p className="text-xs text-neutral-600 italic px-2">No version history yet</p>;
  }
  return (
    <div className="space-y-1">
      {[...doc.versions].reverse().map((v, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-800 transition-colors">
          <History size={11} className="text-neutral-600" />
          <div className="flex-1 min-w-0">
            <span className="text-xs text-neutral-400 font-mono">v{v.version}</span>
            <span className="text-[10px] text-neutral-700 font-mono ml-2">
              {new Date(v.saved_at).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => onRestore(doc.versions.length - 1 - i)}
            className="text-[10px] text-cyan-600 hover:text-cyan-400 font-mono transition-colors"
          >
            restore
          </button>
        </div>
      ))}
    </div>
  );
}

export function WorkspacePanel() {
  const {
    documents, activeDocument, loading,
    createDocument, updateDocument, deleteDocument, restoreVersion, setActiveDocument,
  } = useDocuments();

  const [editContent, setEditContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLanguage, setNewLanguage] = useState<DocLanguage>('markdown');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const handleSelect = (doc: Document) => {
    setActiveDocument(doc);
    setEditContent(doc.content);
    setIsDirty(false);
    setActiveTab('edit');
  };

  const handleContentChange = (val: string) => {
    setEditContent(val);
    setIsDirty(val !== activeDocument?.content);
  };

  const handleSave = async () => {
    if (!activeDocument || !isDirty) return;
    await updateDocument(activeDocument.id, { content: editContent });
    setIsDirty(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createDocument(newTitle.trim(), '', newLanguage);
    setNewTitle('');
    setShowNewModal(false);
    setEditContent('');
    setIsDirty(false);
  };

  const handleDelete = async () => {
    if (!activeDocument) return;
    await deleteDocument(activeDocument.id);
    setEditContent('');
    setIsDirty(false);
  };

  const handleRestore = async (index: number) => {
    if (!activeDocument) return;
    await restoreVersion(activeDocument.id, index);
    const updated = { ...activeDocument, content: activeDocument.versions[index].content };
    setEditContent(updated.content);
    setIsDirty(false);
    setShowVersions(false);
  };

  return (
    <div className="flex h-full bg-neutral-950">
      {/* File tree sidebar */}
      <div className="w-48 border-r border-neutral-800 flex flex-col shrink-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-800">
          <div className="flex items-center gap-1.5">
            <GitBranch size={12} className="text-amber-500" />
            <span className="text-xs font-mono font-semibold text-neutral-400">FILES</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="text-neutral-600 hover:text-cyan-400 transition-colors p-0.5 rounded"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <p className="text-xs text-neutral-700 px-2 font-mono">Loading...</p>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 space-y-2">
              <FolderOpen size={20} className="text-neutral-700" />
              <p className="text-[10px] text-neutral-700 font-mono text-center">No files yet</p>
            </div>
          ) : (
            <FileTree documents={documents} activeId={activeDocument?.id ?? null} onSelect={handleSelect} />
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!activeDocument ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <Terminal size={36} className="text-neutral-700 mx-auto" />
              <p className="text-sm text-neutral-600 font-mono">Select a file or create a new one</p>
              <button
                onClick={() => setShowNewModal(true)}
                className="px-4 py-2 text-xs font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg transition-colors"
              >
                + New File
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
              <div className="flex items-center gap-2">
                {React.createElement(LANG_ICONS[activeDocument.language] || FileText, {
                  size: 13,
                  className: LANG_COLORS[activeDocument.language],
                })}
                <span className="text-xs font-mono text-neutral-300">{activeDocument.title}</span>
                {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
                <Badge variant="default" size="sm">v{activeDocument.version}</Badge>
                <Badge variant="info" size="sm">{activeDocument.language}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Tabs */}
                <div className="flex rounded overflow-hidden border border-neutral-800 mr-1">
                  {(['edit', 'preview'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 text-[10px] font-mono transition-colors ${
                        activeTab === tab ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowVersions(true)}
                  className="p-1.5 text-neutral-600 hover:text-neutral-400 transition-colors rounded"
                  title="Version history"
                >
                  <History size={13} />
                </button>
                {isDirty && (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 text-xs font-mono rounded transition-colors"
                  >
                    <Save size={11} />Save
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 text-neutral-700 hover:text-red-400 transition-colors rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Content */}
            {activeTab === 'edit' ? (
              <textarea
                value={editContent}
                onChange={e => handleContentChange(e.target.value)}
                className="flex-1 bg-transparent px-4 py-4 text-sm font-mono text-neutral-300 resize-none outline-none leading-relaxed placeholder-neutral-700"
                placeholder={`Start writing ${activeDocument.language} here...`}
                spellCheck={false}
              />
            ) : (
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {activeDocument.language === 'markdown' ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-neutral-300 leading-relaxed font-sans">{editContent || <span className="text-neutral-600 italic">Empty document</span>}</pre>
                  </div>
                ) : (
                  <pre className="text-sm font-mono text-neutral-300 leading-relaxed whitespace-pre-wrap">{editContent}</pre>
                )}
              </div>
            )}

            {/* Status bar */}
            <div className="border-t border-neutral-800 px-4 py-1.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 text-[10px] text-neutral-700 font-mono">
                <span>{editContent.split('\n').length} lines</span>
                <span>{editContent.length} chars</span>
              </div>
              <span className="text-[10px] text-neutral-700 font-mono">
                {new Date(activeDocument.updated_at).toLocaleString()}
              </span>
            </div>
          </>
        )}
      </div>

      {/* New file modal */}
      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="Create New File" size="sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono text-neutral-400 block mb-1">File Name</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. README.md"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-700 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-mono text-neutral-400 block mb-1">Language</label>
            <select
              value={newLanguage}
              onChange={e => setNewLanguage(e.target.value as DocLanguage)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 outline-none focus:border-cyan-700 transition-colors"
            >
              {(['markdown', 'typescript', 'javascript', 'python', 'json', 'yaml', 'plaintext', 'css', 'html'] as DocLanguage[]).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            className="w-full py-2 text-xs font-mono font-semibold bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg transition-colors"
          >
            Create File
          </button>
        </div>
      </Modal>

      {/* Version history modal */}
      <Modal open={showVersions} onClose={() => setShowVersions(false)} title="Version History" size="md">
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {activeDocument && (
            <VersionHistory doc={activeDocument} onRestore={handleRestore} />
          )}
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={`Delete "${activeDocument?.title}"`}
        message="This action cannot be undone. The file and all its version history will be permanently removed."
        confirmLabel="Delete File"
        variant="danger"
      />
    </div>
  );
}
