import React from 'react';
import { Generator } from '../types';
import GeneratorCard, { GeneratorWithStats } from './GeneratorCard';
import GeneratorTable from './GeneratorTable';

interface GeneratorListProps {
  generators: GeneratorWithStats[];
  onEdit: (generator: Generator) => void;
  onDelete: (id: string) => void;
}

export default function GeneratorList({ generators, onEdit, onDelete }: GeneratorListProps) {
  return (
    <>
      <div className="hidden md:block">
        <GeneratorTable
          generators={generators}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <div className="md:hidden space-y-4">
        {generators.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500">Nenhum gerador encontrado.</p>
          </div>
        ) : (
          generators.map(generator => (
            <GeneratorCard
              key={generator.id}
              generator={generator}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </>
  );
}
