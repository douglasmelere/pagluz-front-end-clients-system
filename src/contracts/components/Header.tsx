import React from 'react';
import { BarChart3 } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm mb-8">
      <div className="mx-auto max-w-[1600px] px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gradient-to-br from-accent to-accent-secondary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-semibold text-slate-900">Contratos</h1>
            <p className="text-sm text-slate-500 font-medium">Geração automatizada de documentos PagLuz</p>
          </div>
        </div>
      </div>
    </div>
  );
};


