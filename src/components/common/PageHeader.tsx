import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Container, Section } from '../layout';
import { Button } from '../ui';

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
}

export function PageHeader({ icon: Icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <Section
      variant="default"
      className="mb-8 bg-gradient-accent shadow-accent-lg rounded-3xl overflow-hidden py-6 md:py-8 mx-3 sm:mx-4 md:mx-6 mt-4"
    >
      <Container>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-white">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
              <Icon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-white mb-1">{title}</h1>
              <p className="text-white/90">{subtitle}</p>
            </div>
          </div>
          {action && (
            <Button
              onClick={action.onClick}
              variant="ghost"
              size="lg"
              showArrow
              className="bg-white/15 hover:bg-white/25 text-white border border-white/20"
            >
              {action.icon && <action.icon className="h-5 w-5" />}
              {action.label}
            </Button>
          )}
        </div>
      </Container>
    </Section>
  );
}
