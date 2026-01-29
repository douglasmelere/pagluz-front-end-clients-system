import { ReactNode } from 'react';
import { Card } from '../ui';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning';
  className?: string;
  subtitle?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  variant = 'default',
  className = '',
  subtitle
}: StatCardProps) {
  const variantStyles = {
    default: 'border-border',
    accent: 'border-accent/20 bg-gradient-to-br from-accent/5 to-transparent',
    success: 'border-success/20 bg-gradient-to-br from-success/5 to-transparent',
    warning: 'border-warning/20 bg-gradient-to-br from-warning/5 to-transparent'
  };

  const iconVariantStyles = {
    default: 'bg-muted text-foreground',
    accent: 'bg-gradient-accent text-white shadow-accent',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning'
  };

  return (
    <Card 
      className={`p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${variantStyles[variant]} ${className}`}
      hover={false}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-display font-normal text-foreground">
              {value}
            </h3>
            {trend && (
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-xl ${iconVariantStyles[variant]} transition-transform duration-200 hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
