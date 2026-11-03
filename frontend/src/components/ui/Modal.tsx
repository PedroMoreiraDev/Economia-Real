import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  maxWidth = 'md',
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071511]/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidthClasses[maxWidth]} rounded-2xl bg-[#FAF8F4] dark:bg-[#102D25] border border-[#D5CFC0] dark:border-[#214E3E] shadow-2xl overflow-hidden animate-pop-in flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2DDD0] dark:border-[#214E3E] flex items-center justify-between bg-[#F3F0E8]/70 dark:bg-[#0D241D]">
          <div className="flex items-center gap-3.5">
            {icon && (
              <div className="p-2.5 rounded-xl bg-[#1C4939]/10 dark:bg-[#1C4939] text-[#1C4939] dark:text-[#D4A94F] border border-[#1C4939]/20 dark:border-[#D4A94F]/30 shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 id="modal-title" className="text-lg sm:text-xl font-extrabold text-[#102D25] dark:text-[#E8E4D9] tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs font-semibold text-[#526B61] dark:text-[#9AB3A8] mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 rounded-xl text-[#526B61] hover:text-[#102D25] dark:text-[#9AB3A8] dark:hover:text-[#E8E4D9] hover:bg-[#E8E4D9] dark:hover:bg-[#16382E] transition-colors focus:outline-none"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 bg-[#F3F0E8] dark:bg-[#0D241D] border-t border-[#E2DDD0] dark:border-[#214E3E] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
