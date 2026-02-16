import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, options, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={`
              w-full h-12 px-5 pr-10
              bg-transparent
              border border-border rounded-full
              text-foreground
              appearance-none
              font-display
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background
              focus:border-accent
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error focus:ring-error' : ''}
              ${className}
            `}
            {...props}
          >
            {options ? options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) : children}
          </select>

          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Select;
