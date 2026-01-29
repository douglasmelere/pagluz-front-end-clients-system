import React from 'react';

export interface SectionLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  showDot?: boolean;
  pulseDot?: boolean;
  children: React.ReactNode;
}

const SectionLabel = React.forwardRef<HTMLDivElement, SectionLabelProps>(
  ({ showDot = true, pulseDot = false, className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          inline-flex items-center gap-3
          rounded-full
          border border-accent/30 bg-accent/5
          px-5 py-2
          ${className}
        `}
        {...props}
      >
        {showDot && (
          <span className="relative flex h-2 w-2">
            {pulseDot && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            )}
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </span>
        )}
        <span className="font-mono text-xs uppercase tracking-wide text-accent">
          {children}
        </span>
      </div>
    );
  }
);

SectionLabel.displayName = 'SectionLabel';

export default SectionLabel;
