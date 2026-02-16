import React from 'react';
import { ProcuracaoType } from '../types/Contract';
import { Building, User } from 'lucide-react';

interface ProcuracaoTypeSelectorProps {
  selectedType: ProcuracaoType | null;
  onTypeSelect: (type: ProcuracaoType) => void;
}

export const ProcuracaoTypeSelector: React.FC<ProcuracaoTypeSelectorProps> = ({ selectedType, onTypeSelect }) => {
  const procuracaoTypes = [
    { type: 'pj' as ProcuracaoType, title: 'Pessoa Jurídica', description: 'Procuração para empresa/CNPJ', icon: <Building className="h-6 w-6" /> },
    { type: 'pf' as ProcuracaoType, title: 'Pessoa Física', description: 'Procuração para pessoa física/CPF', icon: <User className="h-6 w-6" /> }
  ];

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-display font-semibold text-slate-900 mb-3">Tipo de Procuração</h3>
        <p className="text-slate-500 font-medium">Selecione se a procuração é para pessoa física ou jurídica</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procuracaoTypes.map((type) => (
          <button key={type.type} onClick={() => onTypeSelect(type.type)} className={`p-4 rounded-xl border transition-all duration-300 text-left hover:shadow-md ${selectedType === type.type ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'border-slate-200 hover:border-accent/50 bg-white'}`}>
            <div className="flex items-center mb-2">
              <div className={`p-2 rounded-lg mr-3 shadow-sm ${selectedType === type.type ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>{type.icon}</div>
              <h4 className="font-semibold text-slate-900 font-display">{type.title}</h4>
            </div>
            <p className="text-slate-500 text-sm font-medium">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};


