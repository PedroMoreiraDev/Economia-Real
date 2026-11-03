import React from 'react';

export type BadgeVariant = 'emerald' | 'rose' | 'amber' | 'indigo' | 'sky' | 'slate';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  emerald: 'bg-[#E6EFEA] dark:bg-[#16382E] text-[#1C4939] dark:text-[#78C6A3] border-[#1C4939]/25 dark:border-[#2B6B54]',
  rose: 'bg-rose-50 dark:bg-rose-950/50 text-[#B93838] dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
  amber: 'bg-[#F7EFE0] dark:bg-[#D4A94F]/15 text-[#9A7220] dark:text-[#D4A94F] border-[#D4A94F]/40',
  indigo: 'bg-[#F7EFE0] dark:bg-[#D4A94F]/15 text-[#102D25] dark:text-[#D4A94F] border-[#D4A94F]/50',
  sky: 'bg-[#E6EFEA] dark:bg-[#16382E] text-[#102D25] dark:text-[#E8E4D9] border-[#1C4939]/25 dark:border-[#2B6B54]',
  slate: 'bg-[#EDEAE0] dark:bg-[#14352B] text-[#355248] dark:text-[#B8C7C0] border-[#D5CFC0] dark:border-[#214E3E]',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  icon,
  className = '',
  title,
}) => {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
