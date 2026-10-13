import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Excluir',
  cancelText = 'Cancelar',
  isDanger = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bg-white border-2 border-slate-200 shadow-2xl p-6 sm:p-7 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          title="Fechar"
        >
          <X className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm ${
              isDanger
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}
          >
            {isDanger ? (
              <Trash2 className="h-6 w-6 stroke-[2.5]" />
            ) : (
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
            )}
          </div>

          <div className="space-y-1.5 flex-1 pr-6">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {title}
            </h3>
            <div className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t-2 border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-duo btn-duo-white px-5 py-2.5 text-xs sm:text-sm font-black disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`btn-duo px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 disabled:opacity-50 ${
              isDanger ? 'btn-duo-red' : 'btn-duo-blue'
            }`}
          >
            {isDanger && <Trash2 className="h-4 w-4 stroke-[2.5]" />}
            {loading ? 'Excluindo...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
