import React, { useState } from 'react';
import { Modal } from '@/components/shared/Modal';

interface ProposeCapabilityModalProps {
  open: boolean;
  onClose: () => void;
  onPropose: (name: string, desc: string, rationale: string, code: string) => Promise<void>;
}

const CODE_TEMPLATE = `// Capability implementation
export async function execute(input: Record<string, unknown>): Promise<unknown> {
  // TODO: implement capability logic
  const result = await processInput(input);
  return { success: true, data: result };
}

// Capability metadata
export const metadata = {
  name: 'my_capability',
  version: '1.0.0',
  sandboxed: true,
  permissions: ['read'],
};`;

export function ProposeCapabilityModal({ open, onClose, onPropose }: ProposeCapabilityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rationale, setRationale] = useState('');
  const [code, setCode] = useState(CODE_TEMPLATE);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    setLoading(true);
    await onPropose(name.trim(), description.trim(), rationale.trim(), code);
    setName('');
    setDescription('');
    setRationale('');
    setCode(CODE_TEMPLATE);
    setLoading(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Propose New Capability" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-mono text-neutral-400 block mb-1">Capability Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. image_analyzer"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-700 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-neutral-400 block mb-1">Short Description *</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What this capability does"
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-700 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-mono text-neutral-400 block mb-1">Rationale</label>
          <textarea
            value={rationale}
            onChange={e => setRationale(e.target.value)}
            placeholder="Why is this capability needed? What problem does it solve?"
            rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm font-mono text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-700 transition-colors resize-none"
          />
        </div>
        <div>
          <label className="text-xs font-mono text-neutral-400 block mb-1">Implementation Draft</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            rows={10}
            className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 outline-none focus:border-cyan-700 transition-colors resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-700">
          <button onClick={onClose} className="px-4 py-2 text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name.trim() || !description.trim()}
            className="px-4 py-2 text-xs font-mono font-semibold bg-cyan-700 hover:bg-cyan-600 disabled:bg-neutral-800 disabled:text-neutral-600 text-white rounded-lg transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
