import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ size = 'md', className }) => {
  const sizeClasses = size === 'sm' ? 'h-5 w-5' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return <div className={`animate-spin rounded-full border-2 border-current border-t-transparent text-white ${sizeClasses} ${className || ''}`} />;
};


