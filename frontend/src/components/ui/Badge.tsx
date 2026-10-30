import React from 'react';

export type BadgeVariant = 
  | 'brand' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'neutral' 
  | 'purple';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'sm',
  className = '',
  ...props
}) => {
  const sizeStyles = size === 'sm' 
    ? 'text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full' 
    : 'text-xs px-2.5 py-1 rounded-xl';

  const variantStyles: Record<BadgeVariant, string> = {
    brand: 'bg-blue-100 dark:bg-blue-950/60 text-[#026CD6] dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 font-black',
    success: 'bg-emerald-100 dark:bg-emerald-950/60 text-[#059669] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-black',
    danger: 'bg-rose-100 dark:bg-rose-950/60 text-[#DC2626] dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-black',
    warning: 'bg-amber-100 dark:bg-amber-950/60 text-[#D97706] dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-black',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold',
    purple: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-black',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-numeric uppercase tracking-wider ${sizeStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
