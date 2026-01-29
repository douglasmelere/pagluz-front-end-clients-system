import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      showArrow = false,
      isLoading = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      btn-base
      relative overflow-hidden
      active:scale-[0.98]
    `;

    const variantStyles = {
      primary: `
        bg-gradient-to-r from-accent to-accent-secondary
        text-accent-foreground
        shadow-sm hover:shadow-accent
        hover:-translate-y-0.5 hover:brightness-110
      `,
      secondary: `
        bg-muted text-foreground
        border border-border
        hover:bg-muted/80 hover:border-accent/30
        hover:shadow-md
      `,
      outline: `
        bg-transparent text-foreground
        border border-border
        hover:bg-muted hover:border-accent/30
        hover:shadow-sm
      `,
      ghost: `
        bg-transparent text-muted-foreground
        hover:text-foreground hover:bg-muted
      `
    };

    const sizeStyles = {
      sm: 'h-10 px-4 text-sm',
      md: 'h-12 px-6 text-base',
      lg: 'h-14 px-8 text-lg'
    };

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
      group
    `.trim().replace(/\s+/g, ' ');

    return (
      <button
        ref={ref}
        className={combinedClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Shimmer effect on hover */}
        {variant === 'primary' && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
        
        {/* Content */}
        <span className="relative flex items-center gap-2">
          {isLoading ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              <span>Carregando...</span>
            </>
          ) : (
            <>
              {children}
              {showArrow && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              )}
            </>
          )}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
