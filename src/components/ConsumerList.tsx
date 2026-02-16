import React, { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import ConsumerTable from './ConsumerTable';
import ConsumerCard from './ConsumerCard';
import { Consumer, ConsumerStatus, Generator } from '../types';

interface ConsumerListProps {
  consumers: Consumer[];
  generators: Generator[];
  representatives: any[];
  onEdit: (consumer: Consumer) => void;
  onApprove: (consumer: Consumer) => void;
  onViewInvoice: (consumer: Consumer) => void;
  onGenerateCommission: (id: string) => void;
  hasCommission: (id: string) => boolean;
}

export default function ConsumerList({
  consumers,
  generators,
  representatives,
  onEdit,
  onApprove,
  onViewInvoice,
  onGenerateCommission,
  hasCommission
}: ConsumerListProps) {
  const { isMobile } = useResponsive();
  const [expandedGeneratorId, setExpandedGeneratorId] = useState<string | null>(null);

  const handleShowGeneratorDetails = (id: string) => {
    setExpandedGeneratorId(expandedGeneratorId === id ? null : id);
  };

  if (consumers.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Nenhum consumidor encontrado</h3>
        <p className="mt-1 text-slate-500">Tente ajustar seus filtros ou cadastre um novo consumidor.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4">
        {consumers.map(consumer => (
          <ConsumerCard
            key={consumer.id}
            consumer={consumer}
            generators={generators}
            representatives={representatives}
            onEdit={onEdit}
            onApprove={onApprove}
            onViewInvoice={onViewInvoice}
            onGenerateCommission={onGenerateCommission}
            hasCommission={hasCommission}
          />
        ))}
      </div>
    );
  }

  return (
    <ConsumerTable
      consumers={consumers}
      generators={generators}
      representatives={representatives}
      onEdit={onEdit}
      onApprove={onApprove}
      onViewInvoice={onViewInvoice}
      onGenerateCommission={onGenerateCommission}
      hasCommission={hasCommission}
      onShowGeneratorDetails={handleShowGeneratorDetails}
      expandedGeneratorId={expandedGeneratorId}
    />
  );
}
