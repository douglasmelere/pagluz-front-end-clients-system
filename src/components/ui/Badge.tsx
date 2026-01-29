import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  pulseDot?: boolean;
  children: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      showDot = false,
      pulseDot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center gap-2
      font-medium rounded-full
      transition-all duration-200
    `;

    const variantStyles = {
      default: `
        bg-muted text-foreground
        border border-border
      `,
      accent: `
        bg-accent/5 text-accent
        border border-accent/30
      `,
      success: `
        bg-success/5 text-success
        border border-success/30
      `,
      warning: `
        bg-warning/5 text-warning
        border border-warning/30
      `,
      error: `
        bg-error/5 text-error
        border border-error/30
      `,
      outline: `
        bg-transparent text-foreground
        border border-border
      `
    };

    const sizeStyles = {
      sm: 'px-3 py-1 text-xs',
      md: 'px-4 py-1.5 text-sm',
      lg: 'px-5 py-2 text-base'
    };

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim().replace(/\s+/g, ' ');

    const dotColor = {
      default: 'bg-muted-foreground',
      accent: 'bg-accent',
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-error',
      outline: 'bg-foreground'
    }[variant];

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {showDot && (
          <span className="relative flex h-2 w-2">
            {pulseDot && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
          </span>
        )}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
