import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, type = 'text', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            className={`
              w-full h-12 px-5 ${icon ? 'pl-12' : ''}
              bg-transparent
              border border-border rounded-full
              text-foreground placeholder:text-muted-foreground/50
              font-display
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
              focus:border-accent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error focus:ring-error' : ''}
              ${className}
            `}
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
