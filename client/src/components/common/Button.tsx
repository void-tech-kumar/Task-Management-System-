import React from 'react';
import { cn } from '../../utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-sm focus:ring-[#4F46E5] active:scale-[0.98]',
    secondary:
      'bg-[#2563EB] hover:bg-blue-700 text-white shadow-sm focus:ring-[#2563EB] active:scale-[0.98]',
    outline:
      'border border-[#CBD5E1] bg-white hover:bg-slate-100 text-[#0F172A] shadow-xs focus:ring-[#4F46E5] active:scale-[0.98]',
    danger:
      'bg-[#DC2626] hover:bg-red-700 text-white shadow-sm focus:ring-[#DC2626] active:scale-[0.98]',
    success:
      'bg-[#16A34A] hover:bg-green-700 text-white shadow-sm focus:ring-[#16A34A] active:scale-[0.98]',
    ghost:
      'text-[#475569] hover:text-[#0F172A] hover:bg-slate-200/70 focus:ring-slate-400',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

