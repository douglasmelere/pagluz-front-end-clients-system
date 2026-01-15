import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { utilityClasses } from '../../utils/designTokens';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm font-medium',
    md: 'px-4 py-2.5 text-sm font-medium',
    lg: 'px-6 py-3 text-base font-medium',
    xl: 'px-8 py-4 text-lg font-semibold',
  };

  const variantClasses = {
    primary: utilityClasses.button.primary,
    secondary: utilityClasses.button.secondary,
    outline: utilityClasses.button.outline,
    ghost: utilityClasses.button.ghost,
    danger: utilityClasses.button.danger,
    success: utilityClasses.button.success,
  };

  const baseClasses = [
    utilityClasses.button.base,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && 'w-full',
    rounded && 'rounded-full',
    loading && 'opacity-75 cursor-wait',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  ].filter(Boolean).join(' ');

  const iconClasses = [
    'transition-transform duration-200 flex-shrink-0',
    loading && 'animate-spin',
    iconPosition === 'right' && 'ml-2 order-last',
          {Icon && iconPosition === 'left' && (
            <Icon className={`h-5 w-5 ${iconClasses}`} />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon className={`h-5 w-5 ${iconClasses}`} />
          )}
        </>
      )}
    </button>
  );
}
    >
      {children}
    </Button>
  );
}

export function FloatingButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'lg',
  className,
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={Icon}
      className={cn(
        'fixed bottom-6 right-6 rounded-full shadow-[0_0_20px_rgba(0,255,136,0.4)] hover:shadow-[0_0_30px_rgba(0,255,136,0.6)]',
        'transform hover:scale-110 active:scale-95',
        'z-50',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
