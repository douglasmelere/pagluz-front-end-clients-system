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
    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 p-8 mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Tipo de Procuração</h3>
        <p className="text-slate-600">Selecione se a procuração é para pessoa física ou jurídica</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {procuracaoTypes.map((type) => (
          <button key={type.type} onClick={() => onTypeSelect(type.type)} className={`p-4 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-md ${selectedType === type.type ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
            <div className="flex items-center mb-2">
              <div className={`p-2 rounded-lg mr-3 ${selectedType === type.type ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{type.icon}</div>
              <h4 className="font-semibold text-gray-900">{type.title}</h4>
            </div>
            <p className="text-slate-600 text-sm">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};


