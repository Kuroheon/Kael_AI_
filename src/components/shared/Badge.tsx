import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-neutral-700 text-neutral-300 border border-neutral-600',
  success: 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/50',
  warning: 'bg-amber-900/50 text-amber-400 border border-amber-700/50',
  error: 'bg-red-900/50 text-red-400 border border-red-700/50',
  info: 'bg-cyan-900/50 text-cyan-400 border border-cyan-700/50',
  purple: 'bg-violet-900/50 text-violet-400 border border-violet-700/50',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-neutral-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-cyan-400',
  purple: 'bg-violet-400',
};

export function Badge({ children, variant = 'default', size = 'sm', dot, className = '' }: BadgeProps) {
  const sizes = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-mono font-medium ${sizes} ${variants[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
