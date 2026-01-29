import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'accent';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3'
  };

  const variantStyles = {
    default: 'border-muted-foreground border-t-transparent',
    accent: 'border-accent border-t-transparent'
  };

  return (
    <div
      className={`
        animate-spin rounded-full
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
};

export default LoadingSpinner;
