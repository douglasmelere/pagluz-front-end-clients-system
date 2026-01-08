import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { changeRequestService, ChangeRequest } from '../../types/services/changeRequestService';
import ChangeRequestCard from './ChangeRequestCard';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

export default function PendingChanges() {
  const toast = useToast();
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const loadPendingChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await changeRequestService.getPending({
        page: pagination.page,
        limit: pagination.limit,
      });
      setChanges(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mudanças pendentes';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingChanges();
  }, [pagination.page]);

  const handleApprove = async (changeRequestId: string) => {
    try {
      await changeRequestService.approve(changeRequestId);
      toast.showSuccess('Mudança aprovada com sucesso!');
      loadPendingChanges();
    } catch (error) {
      toast.showError('Erro ao aprovar mudança. Tente novamente.');
    }
  };

  const handleReject = async (changeRequestId: string, reason: string) => {
    try {
      await changeRequestService.reject(changeRequestId, reason);
      toast.showSuccess('Mudança rejeitada com sucesso.');
      loadPendingChanges();
    } catch (error) {
      toast.showError('Erro ao rejeitar mudança. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-green-600 mx-auto mb-6" />
          <p className="text-slate-600 text-lg">Carregando mudanças pendentes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={loadPendingChanges} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
        <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Mudanças Pendentes</h1>
                  <p className="text-slate-200 text-sm sm:text-base lg:text-lg mt-1">Aprove ou rejeite alterações solicitadas por representantes</p>
                </div>
              </div>
            </div>
            <button
              onClick={loadPendingChanges}
              className="bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base">Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full lg:max-w-6xl xl:max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Estatísticas */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Total de Mudanças Pendentes</h2>
              <p className="text-slate-600 mt-1">{pagination.total} solicitações aguardando aprovação</p>
            </div>
            <div className="text-4xl font-bold text-yellow-600">
              {pagination.total}
            </div>
          </div>
        </div>

        {/* Lista de Mudanças */}
        {changes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
            <AlertCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhuma mudança pendente</h3>
            <p className="text-slate-600">Todas as solicitações foram processadas.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {changes.map((change) => (
              <ChangeRequestCard
                key={change.id}
                change={change}
                onApprove={() => handleApprove(change.id)}
                onReject={(reason) => handleReject(change.id, reason)}
              />
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



