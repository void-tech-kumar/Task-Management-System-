import React from 'react';
import { cn } from '../../utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#CBD5E1] shadow-sm transition-all overflow-hidden',
        hoverEffect && 'hover:shadow-md hover:border-indigo-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

