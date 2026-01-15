import React, { ReactNode } from 'react';
import { utilityClasses } from '../../utils/designTokens';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function Card({ 
  children, 
  className, 
  variant = 'default',
  padding = 'md',
  onClick,
  disabled = false,
  loading = false
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };

  const variantClasses = {
    default: 'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300',
    elevated: 'bg-white rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
    outlined: 'bg-white rounded-2xl border-2 border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all duration-300',
    interactive: [
      'bg-white rounded-2xl border border-slate-200 shadow-sm',
      'hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1',
      'transition-all duration-300 cursor-pointer active:scale-95'
    ].join(' '),
    gradient: 'bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300'
  };

  const baseClasses = [
    variantClasses[variant],
    paddingClasses[padding],
    disabled && 'opacity-50 cursor-not-allowed',
    loading && 'opacity-75',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={baseClasses}
      onClick={disabled || loading ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={onClick && !disabled ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      )}
      {children}
    </div>
  );
}

// Variantes específicas para casos de uso comuns
export function StatsCard({ 
  children, 
  className,
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon
}: {
  children?: ReactNode;
  className?: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const changeColors = {
    positive: 'text-green-600 bg-green-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50'
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {change && (
            <div className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2', changeColors[changeType])}>
              {changeType === 'positive' && '↗'}
              {changeType === 'negative' && '↘'}
              {changeType === 'neutral' && '→'}
              <span className="ml-1">{change}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="p-3 bg-gradient-to-r from-[#35cc20]/20 to-[#6edc5f]/20 rounded-xl">
            <Icon className="h-6 w-6 text-[#35cc20]" />
          </div>
        )}
      </div>
      {children}
    </Card>
  );
}

export function InteractiveCard({ 
  children, 
  className,
  onClick,
  disabled = false,
  loading = false
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Card 
      variant="interactive"
      className={className}
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {children}
    </Card>
  );
}
