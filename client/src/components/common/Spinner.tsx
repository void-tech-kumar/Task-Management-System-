import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className, label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-2">
      <Loader2 className={cn('animate-spin text-indigo-600', sizes[size], className)} />
      {label && <p className="text-xs text-slate-500 font-medium">{label}</p>}
    </div>
  );
};
