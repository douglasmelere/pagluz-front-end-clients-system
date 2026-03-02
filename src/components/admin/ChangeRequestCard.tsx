import { useState } from 'react';
import { ChangeRequest, ChangeRequestStatus } from '../../types/services/changeRequestService';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import RejectModal from './RejectModal';

interface ChangeRequestCardProps {
  change: ChangeRequest;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

function translateField(field: string): string {
  const translations: Record<string, string> = {
    name: 'Nome',
    phone: 'Telefone',
    email: 'E-mail',
    averageMonthlyConsumption: 'Consumo Médio Mensal',
    discountOffered: 'Desconto Oferecido',
    city: 'Cidade',
    state: 'Estado',
    street: 'Rua',
    number: 'Número',
    neighborhood: 'Bairro',
    zipCode: 'CEP',
    ucNumber: 'Número da UC',
    consumerType: 'Tipo de Consumidor',
    phase: 'Fase',
    concessionaire: 'Concessionária',
  };
  return translations[field] || field;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (value instanceof Date) return new Date(value).toLocaleDateString('pt-BR');
  if (typeof value === 'number') {
    if (value % 1 !== 0) {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('pt-BR');
  }
  return String(value);
}

export default function ChangeRequestCard({ change, onApprove, onReject }: ChangeRequestCardProps) {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusBadge = (status: ChangeRequestStatus) => {
    const badges = {
      PENDING: { text: 'Pendente', class: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      APPROVED: { text: 'Aprovado', class: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      REJECTED: { text: 'Rejeitado', class: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    };
    return badges[status] || badges.PENDING;
  };

  const statusBadge = getStatusBadge(change.status);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-display font-bold text-slate-900 mb-1 leading-tight">{change.consumer.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-500 font-medium">
              <span>CPF/CNPJ: <span className="text-slate-700 font-semibold">{change.consumer.cpfCnpj}</span></span>
              <span>UC: <span className="text-slate-700 font-semibold">{change.consumer.ucNumber}</span></span>
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">
              <span>Representante: </span>
              <span className="font-bold text-accent font-display">{change.representative.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold font-display border shadow-sm ${statusBadge.class}`}>
              <statusBadge.icon className="h-3.5 w-3.5 mr-1.5" />
              {statusBadge.text.toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-slate-400 font-display bg-slate-100 px-2 py-1 rounded-md">
              {new Date(change.requestedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Campos Alterados */}
      <div className="px-6 py-5">
        <div className="mb-6">
          <h4 className="text-sm font-display font-bold text-slate-800 mb-3 flex items-center">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
            Campos Alterados:
          </h4>
          <div className="flex flex-wrap gap-2">
            {change.changedFields.map((field) => (
              <span
                key={field}
                className="px-3 py-1.5 bg-blue-50/80 text-blue-700 rounded-xl text-xs font-bold font-display border border-blue-100 shadow-sm hover:bg-blue-100 transition-colors"
              >
                {translateField(field)}
              </span>
            ))}
          </div>
        </div>

        {/* Comparação Antes/Depois */}
        {showDetails && (
          <div className="mt-6 border-t border-slate-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="text-sm font-display font-bold text-slate-800 mb-4 flex items-center">
              <span className="w-1.5 h-1.5 bg-accent rounded-full mr-2"></span>
              Comparação de Valores:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-600 border border-slate-100 font-display uppercase tracking-wider">Campo</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-yellow-800 border border-slate-100 bg-yellow-50/50 font-display uppercase tracking-wider">Valor Anterior</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-emerald-800 border border-slate-100 bg-emerald-50/30 font-display uppercase tracking-wider">Novo Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {change.changedFields.map((field) => (
                    <tr key={field} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 text-sm font-bold text-slate-900 border border-slate-100 font-display bg-slate-50/30">
                        {translateField(field)}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-slate-600 border border-slate-100 bg-yellow-50/30">
                        {formatValue(change.oldValues[field])}
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-700 border border-slate-100 bg-emerald-50/20">
                        {formatValue(change.newValues[field])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Motivo da Rejeição */}
        {change.status === ChangeRequestStatus.REJECTED && change.rejectionReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl">
            <h4 className="text-sm font-display font-bold text-red-800 mb-1 flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Motivo da Rejeição:
            </h4>
            <p className="text-sm text-red-700 font-medium pl-6">{change.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Ações */}
      {change.status === ChangeRequestStatus.PENDING && (
        <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-5 py-2.5 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-all font-display font-bold text-sm border border-slate-200 shadow-sm hover:shadow-md"
          >
            <Eye className="h-4.5 w-4.5" />
            <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onApprove}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl transition-all duration-300 font-display font-bold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <CheckCircle className="h-4.5 w-4.5" />
              <span>Aprovar</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl transition-all duration-300 font-display font-bold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5"
            >
              <XCircle className="h-4.5 w-4.5" />
              <span>Rejeitar</span>
            </button>
          </div>
        </div>
      )}

      {showRejectModal && (
        <RejectModal
          onClose={() => setShowRejectModal(false)}
          onConfirm={(reason) => {
            onReject(reason);
            setShowRejectModal(false);
          }}
        />
      )}
    </div>
  );
}







