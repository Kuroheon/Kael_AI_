import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger',
}: ConfirmDialogProps) {
  const btnClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-500 text-white'
    : 'bg-amber-600 hover:bg-amber-500 text-white';

  return (
    <Modal open={open} onClose={onClose} title="Confirmation Required" size="sm">
      <div className="flex gap-3 mb-4">
        <AlertTriangle size={20} className={variant === 'danger' ? 'text-red-400 shrink-0 mt-0.5' : 'text-amber-400 shrink-0 mt-0.5'} />
        <div>
          <p className="text-sm font-semibold text-neutral-200 mb-1">{title}</p>
          <p className="text-xs text-neutral-400">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-neutral-700">
        <button onClick={onClose} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors font-mono">
          Cancel
        </button>
        <button onClick={() => { onConfirm(); onClose(); }} className={`px-3 py-1.5 text-xs rounded font-mono font-semibold transition-colors ${btnClass}`}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
