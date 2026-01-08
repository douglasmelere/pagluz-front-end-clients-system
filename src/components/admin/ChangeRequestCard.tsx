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
            <h3 className="text-lg font-bold text-slate-900 mb-1">{change.consumer.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span>CPF/CNPJ: {change.consumer.cpfCnpj}</span>
              <span>UC: {change.consumer.ucNumber}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">
              <span>Representante: </span>
              <span className="font-semibold text-slate-700">{change.representative.name}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.class}`}>
              <statusBadge.icon className="h-3 w-3 mr-1" />
              {statusBadge.text}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(change.requestedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Campos Alterados */}
      <div className="px-6 py-4">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Campos Alterados:</h4>
          <div className="flex flex-wrap gap-2">
            {change.changedFields.map((field) => (
              <span
                key={field}
                className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200"
              >
                {translateField(field)}
              </span>
            ))}
          </div>
        </div>

        {/* Comparação Antes/Depois */}
        {showDetails && (
          <div className="mt-4 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Comparação de Valores:</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-200">Campo</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-200 bg-yellow-50">Valor Anterior</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700 border border-slate-200 bg-green-50">Novo Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {change.changedFields.map((field) => (
                    <tr key={field} className="hover:bg-slate-50">
                      <td className="px-4 py-2 text-sm font-medium text-slate-900 border border-slate-200">
                        {translateField(field)}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 border border-slate-200 bg-yellow-50">
                        {formatValue(change.oldValues[field])}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 border border-slate-200 bg-green-50">
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
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <h4 className="text-sm font-semibold text-red-800 mb-1">Motivo da Rejeição:</h4>
            <p className="text-sm text-red-700">{change.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Ações */}
      {change.status === ChangeRequestStatus.PENDING && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-300"
          >
            <Eye className="h-4 w-4" />
            <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={onApprove}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Aprovar</span>
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <XCircle className="h-4 w-4" />
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







