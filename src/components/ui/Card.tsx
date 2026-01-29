import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'featured';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = false, className = '', children, ...props }, ref) => {
    const baseStyles = `
      bg-card rounded-xl
      transition-all duration-300
    `;

    const variantStyles = {
      default: `
        border border-border
        shadow-md
      `,
      elevated: `
        border border-border
        shadow-lg
      `,
      featured: `
        relative
        bg-gradient-to-br from-accent via-accent-secondary to-accent
        p-[2px]
      `
    };

    const hoverStyles = hover ? `
      hover:shadow-xl hover:-translate-y-0.5
      hover:bg-gradient-to-br hover:from-accent/[0.03] hover:to-transparent
    ` : '';

    if (variant === 'featured') {
      return (
        <div
          ref={ref}
          className={`${baseStyles.replace('bg-card', '')} ${variantStyles.featured} ${className}`}
          {...props}
        >
          <div className="h-full w-full rounded-[calc(0.75rem-2px)] bg-card p-6">
            {children}
          </div>
        </div>
      );
    }

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${hoverStyles}
      ${className}
      group
    `.trim().replace(/\s+/g, ' ');

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 ${className}`}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', ...props }, ref) => (
    <h3
      ref={ref}
      className={`font-sans text-2xl font-semibold leading-none tracking-tight ${className}`}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div ref={ref} className={`pt-0 ${className}`} {...props} />
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center pt-0 ${className}`}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export default Card;
