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

  return (
    <button
      className={`${baseClasses} group relative overflow-hidden flex items-center justify-center`}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 transition-all duration-700 -translate-x-full group-hover:translate-x-full pointer-events-none"></div>
      
      <div className="flex items-center justify-center relative z-10">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className="h-5 w-5 mr-2" />
            )}
            <span>{children}</span>
            {Icon && iconPosition === 'right' && (
              <Icon className="h-5 w-5 ml-2" />
            )}
          </>
        )}
      </div>
    </button>
  );
}
