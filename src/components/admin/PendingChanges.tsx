import { useState, useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import { changeRequestService, ChangeRequest } from '../../types/services/changeRequestService';
import ChangeRequestCard from './ChangeRequestCard';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';
import Button from '../ui/Button';

export default function PendingChanges() {
  const { showError, showSuccess } = useToast();
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
      showSuccess('Mudança aprovada com sucesso!');
      loadPendingChanges();
    } catch (error) {
      showError('Erro ao aprovar mudança. Tente novamente.');
    }
  };

  const handleReject = async (changeRequestId: string, reason: string) => {
    try {
      await changeRequestService.reject(changeRequestId, reason);
      showSuccess('Mudança rejeitada com sucesso.');
      loadPendingChanges();
    } catch (error) {
      showError('Erro ao rejeitar mudança. Tente novamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-accent mx-auto mb-6" />
          <p className="text-slate-600 font-display text-lg">Carregando mudanças pendentes...</p>
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
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Mudanças Pendentes</h1>
                <p className="text-slate-500 font-medium text-sm font-display">Aprove ou rejeite alterações solicitadas</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={loadPendingChanges}
                className="bg-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Lista
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Info Card */}
        {pagination.total > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">Solicitações Aguardando</h2>
              <p className="text-slate-500 text-sm font-display">Total de requisições pendentes de análise</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
              <span className="text-xl font-bold text-amber-600 font-display">{pagination.total}</span>
            </div>
          </div>
        )}

        {/* Lista de Mudanças */}
        {changes.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 shadow-sm border border-slate-200 text-center">
            <div className="mx-auto h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">Nenhuma mudança pendente</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-display">
              Não há solicitações de alteração aguardando aprovação no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
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
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500 font-display">
              Página <span className="font-medium text-slate-900">{pagination.page}</span> de <span className="font-medium text-slate-900">{pagination.totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
