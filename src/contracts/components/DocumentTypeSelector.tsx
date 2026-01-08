import React from 'react';
import { DocumentType } from '../types/Contract';
import { FileText, Briefcase, Scale } from 'lucide-react';

interface DocumentTypeSelectorProps {
  selectedType: DocumentType | null;
  onTypeSelect: (type: DocumentType) => void;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({ selectedType, onTypeSelect }) => {
  const documentTypes = [
    { type: 'locacao' as DocumentType, title: 'Contrato de Locação', description: 'Aluguel de capacidade de geração e transferência de créditos de energia', icon: <FileText className="h-8 w-8" />, color: 'from-sky-500 to-blue-600' },
    { type: 'prestacao' as DocumentType, title: 'Contrato de Prestação de Serviços', description: 'Prestação de serviços relacionados à energia solar', icon: <Briefcase className="h-8 w-8" />, color: 'from-emerald-500 to-green-600' },
    { type: 'procuracao' as DocumentType, title: 'Procuração', description: 'Documento de representação legal', icon: <Scale className="h-8 w-8" />, color: 'from-indigo-500 to-purple-600' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 mb-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Selecione o Tipo de Documento</h2>
        <p className="text-gray-600">Escolha o tipo de documento que deseja gerar</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {documentTypes.map((doc) => (
          <button key={doc.type} onClick={() => onTypeSelect(doc.type)} className={`p-6 rounded-xl border-2 transition-all duration-300 text-left hover:shadow-lg transform hover:-translate-y-1 ${selectedType === doc.type ? 'border-emerald-500 bg-emerald-50 shadow-lg' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
            <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${doc.color} text-white mb-4`}>{doc.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{doc.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{doc.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};


