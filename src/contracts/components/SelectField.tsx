import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, options, placeholder = 'Selecione...', required = false, disabled = false, error, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-slate-900">
        {label}
        {required && <span className="text-accent ml-1">*</span>}
      </label>
      <div className="relative">
        <select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`w-full px-4 py-3 border rounded-xl shadow-sm transition-all duration-200 focus:ring-4 focus:ring-accent/10 focus:border-accent hover:border-accent/50 appearance-none bg-white ${error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-slate-200'} ${disabled ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-900'} font-medium`}>
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
      </div>
      {error && (<p className="text-sm text-red-600 font-medium">{error}</p>)}
    </div>
  );
};


