import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isCompleted?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, icon, children, isCompleted = false }) => {
  return (
    <div className={`rounded-2xl border border-white/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${isCompleted ? 'ring-2 ring-accent/20 bg-slate-50/50' : ''}`}>
      <div className="mb-8">
        <div className="flex items-center mb-3">
          {icon && (
            <div className={`mr-4 p-3 rounded-xl shadow-lg shadow-accent/10 ${isCompleted ? 'bg-accent text-white' : 'bg-gradient-to-br from-accent to-accent-secondary text-white'}`}>{icon}</div>
          )}
          <h3 className="text-xl font-display font-semibold text-slate-900">{title}</h3>
          {isCompleted && (
            <div className="ml-auto"><div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div></div>
          )}
        </div>
        {description && (<p className="text-slate-500 text-sm font-medium ml-16">{description}</p>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
};


