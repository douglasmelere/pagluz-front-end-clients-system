import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, name, type = 'text', value, onChange, placeholder, required = false, disabled = false, error, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <input type={type} id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`w-full px-4 py-3 border rounded-xl shadow-sm transition-all duration-200 focus:ring-4 focus:ring-accent/10 focus:border-accent hover:border-accent/50 ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-slate-200'} ${disabled ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-900'} font-medium placeholder:text-slate-400`} />
      {error && (<p className="text-sm text-red-600 font-medium">{error}</p>)}
    </div>
  );
};


