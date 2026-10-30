import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'brand' 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'secondary' 
  | 'outline' 
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'brand',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-black select-none transition-all duration-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-2xl gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 rounded-2xl gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    brand: 'bg-[#026CD6] hover:bg-[#0A7DEF] text-white border-b-4 border-[#0153AB] active:translate-y-1 active:border-b-0 shadow-sm shadow-blue-500/10',
    success: 'bg-[#10B981] hover:bg-[#059669] text-white border-b-4 border-[#047857] active:translate-y-1 active:border-b-0 shadow-sm shadow-emerald-500/10',
    danger: 'bg-[#EF4444] hover:bg-[#DC2626] text-white border-b-4 border-[#B91C1C] active:translate-y-1 active:border-b-0 shadow-sm',
    warning: 'bg-[#F59E0B] hover:bg-[#D97706] text-amber-950 border-b-4 border-[#B45309] active:translate-y-1 active:border-b-0 shadow-sm',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 active:translate-y-0.5 shadow-sm',
    outline: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-700',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
