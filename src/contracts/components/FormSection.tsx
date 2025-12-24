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
    <div className={`bg-white rounded-2xl shadow-lg border-2 p-8 mb-8 transition-all duration-300 hover:shadow-xl ${isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-emerald-300'}`}>
      <div className="mb-8">
        <div className="flex items-center mb-3">
          {icon && (
            <div className={`mr-4 p-3 rounded-full ${isCompleted ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'}`}>{icon}</div>
          )}
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          {isCompleted && (
            <div className="ml-auto"><div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div></div>
          )}
        </div>
        {description && (<p className="text-gray-600 leading-relaxed">{description}</p>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
};


