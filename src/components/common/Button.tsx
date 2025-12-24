import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn, utilityClasses } from '../../utils/designTokens';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'neon';
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
  const baseClasses = cn(
    utilityClasses.button.base,
    utilityClasses.button[variant],
    utilityClasses.button.sizes[size],
    'shadow-pagluzGreen hover:shadow-neon transition-shadow duration-200 will-change-transform',
    fullWidth && 'w-full',
    rounded && 'rounded-full',
    loading && utilityClasses.states.loading,
    disabled && utilityClasses.states.disabled,
    className
  );

  const iconClasses = cn(
    'transition-transform duration-200',
    loading && 'animate-spin',
    iconPosition === 'right' && 'ml-2',
    iconPosition === 'left' && 'mr-2'
  );

  return (
    <button
      className={cn(baseClasses, 'active:scale-[0.98]')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={cn('h-4 w-4', iconClasses)} />
          <span className="ml-2">Carregando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={iconClasses} />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon className={iconClasses} />
          )}
        </>
      )}
    </button>
  );
}

// Variantes específicas para casos de uso comuns
type IconButtonProps = Omit<ButtonProps, 'iconPosition' | 'fullWidth' | 'icon'> & {
  icon: React.ComponentType<{ className?: string }>;
};

export function IconButton({
  icon: Icon,
  children,
  className,
  size = 'md',
  variant = 'ghost',
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
    xl: 'p-5'
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(sizeClasses[size], 'aspect-square', className)}
      {...props}
    >
      <Icon className="h-5 w-5" />
      {children}
    </Button>
  );
}

export function ActionButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      icon={Icon}
      iconPosition="left"
      className="shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
      {...props}
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
