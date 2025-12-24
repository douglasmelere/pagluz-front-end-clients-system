import React from 'react';
import { BarChart3 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
      <div className="w-full px-4 md:px-6 py-6 md:py-8">
        <div className="flex items-center space-x-3 text-white">
          <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Contratos</h1>
            <p className="text-white/90 text-sm md:text-base mt-1">Geração automatizada de documentos PagLuz</p>
          </div>
        </div>
      </div>
    </div>
  );
};


