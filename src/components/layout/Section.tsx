import React from 'react';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'inverted' | 'muted' | 'accent';
  spacing?: 'sm' | 'md' | 'lg';
  withDotPattern?: boolean;
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(
  (
    {
      variant = 'default',
      spacing = 'md',
      withDotPattern = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: 'bg-background text-foreground',
      inverted: 'bg-foreground text-background',
      muted: 'bg-muted text-foreground',
      accent: 'bg-gradient-accent text-accent-foreground'
    } as const;

    const spacingStyles = {
      sm: 'py-10 md:py-14',
      md: 'py-14 md:py-20',
      lg: 'py-20 md:py-28'
    };

    return (
      <section
        ref={ref}
        className={`
          relative
          ${variantStyles[variant]}
          ${spacingStyles[spacing]}
          ${className}
        `}
        {...props}
      >
        {withDotPattern && variant === 'inverted' && (
          <div className="absolute inset-0 dot-pattern pointer-events-none" />
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </section>
    );
  }
);

Section.displayName = 'Section';

export default Section;
