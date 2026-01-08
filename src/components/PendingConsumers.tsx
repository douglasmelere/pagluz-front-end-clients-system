import React, { useEffect, useMemo, useState } from 'react';
import { clienteConsumidorService } from '../types/services/clienteConsumidorService';
import { representanteComercialService } from '../types/services/representanteComercialService';
import { settingsService } from '../types/services/settingsService';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import { DollarSign, Zap, Calculator, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import InvoiceModal from './admin/InvoiceModal';

type Filters = {
  state?: string;
  city?: string;
  representativeId?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
};

const DEFAULT_LIMIT = 20;

export default function PendingConsumers() {
  const { user, logout } = useApp();
  const toast = useToast();

  const initialFilters: Filters = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      state: params.get('state') || undefined,
      city: params.get('city') || undefined,
      representativeId: params.get('representativeId') || undefined,
      startDate: params.get('startDate') || undefined,
      endDate: params.get('endDate') || undefined,
      page: Number(params.get('page') || 1),
      limit: Number(params.get('limit') || DEFAULT_LIMIT)
    };
  }, []);

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string | null; reason: string }>(
    { open: false, id: null, reason: '' }
  );
  const [confirmApprove, setConfirmApprove] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [kwhPrice, setKwhPrice] = useState<number>(0);
  const [loadingKwhPrice, setLoadingKwhPrice] = useState(false);
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; consumer: any | null }>({
    isOpen: false,
    consumer: null
  });

  // Keep query string in sync
  useEffect(() => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const newUrl = `${window.location.pathname}?${qs.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  const { data, loading, error, refetch } = useApi(
    () => clienteConsumidorService.getPending(filters),
    [filters]
  );

  const { mutate: approveMutate, loading: approving } = useApiMutation<void>();
  const { mutate: rejectMutate, loading: rejecting } = useApiMutation<void>();

  // Handle auth/permission errors from API
  useEffect(() => {
    if (!error) return;
    const msg = error.toLowerCase();
    if (msg.includes('401') || msg.includes('unauthorized')) {
      toast.showError('Sua sessão expirou. Faça login novamente.');
      logout().catch(() => {});
    }
  }, [error, logout, toast]);

  // Representatives for autocomplete (basic load; could be improved with true autocomplete if API supports search)
  const { data: representativesData } = useApi(
    () => representanteComercialService.getAll({ status: 'ACTIVE' as any }),
    []
  );

  // Load current kWh price
  useEffect(() => {
    const loadKwhPrice = async () => {
      try {
        setLoadingKwhPrice(true);
        const price = await settingsService.getKwhPrice();
        setKwhPrice(price);
      } catch (error) {
        // Silently fail - price will default to 0
      } finally {
        setLoadingKwhPrice(false);
      }
    };
    loadKwhPrice();
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: DEFAULT_LIMIT });
  };

  const onApprove = async (id: string) => {
    try {
      await approveMutate(() => clienteConsumidorService.approve(id));
      await refetch();
      toast.showSuccess('Consumidor aprovado com sucesso!');
    } catch (error) {
      toast.showError('Erro ao aprovar consumidor');
    }
  };

  const onReject = async (id: string, reason?: string) => {
    try {
      await rejectMutate(() => clienteConsumidorService.reject(id, reason));
      await refetch();
      toast.showSuccess('Consumidor rejeitado com sucesso');
    } catch (error) {
      toast.showError('Erro ao rejeitar consumidor');
    }
  };

  // Calculate commission for a consumer
  const calculateCommission = (consumer: any) => {
    if (!consumer.Representative) {
      return null;
    }
    
    if (!kwhPrice) {
      return null;
    }
    
    if (!consumer.averageMonthlyConsumption) {
      return null;
    }
    
    const kwh = consumer.averageMonthlyConsumption;
    
    // Usar fórmula padrão do sistema: C = (K * 0.865 * P) / 2
    const commissionValue = (kwh * 0.865 * kwhPrice) / 2;
    
    return {
      kwh,
      kwhPrice,
      commissionValue: Math.round(commissionValue * 100) / 100 // Round to 2 decimal places
    };
  };

  const pagination = data?.pagination || { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
  const consumers = data?.consumers || [];

  const isOperatorPlus = user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(((user.role as unknown as string) || '').toUpperCase());
  if (!isOperatorPlus) {
    return (
      <div className="py-8">
        <h2 className="text-xl font-semibold text-red-600">Permissão insuficiente</h2>
        <p className="text-slate-600 mt-2">Você não possui acesso a esta área.</p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Pendentes de aprovação</h1>
        <p className="text-slate-500">Revise consumidores enviados por representantes e aprove ou rejeite.</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 mb-4">
        <div>
          <label className="block text-xs text-slate-600 mb-1">UF</label>
          <select
            value={filters.state || ''}
            onChange={e => setFilters(prev => ({ ...prev, state: e.target.value || undefined }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todas</option>
            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Cidade</label>
          <input
            type="text"
            value={filters.city || ''}
            onChange={e => setFilters(prev => ({ ...prev, city: e.target.value || undefined }))}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            placeholder="Digite a cidade"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-600 mb-1">Representante</label>
          <input
            list="representatives-list"
            value={filters.representativeId || ''}
            onChange={e => setFilters(prev => ({ ...prev, representativeId: e.target.value || undefined }))}
            placeholder="Nome ou email (selecione item)"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <datalist id="representatives-list">
            {(representativesData || []).map((r: any) => (
              <option key={r.id} value={r.id}>{`${r.name} - ${r.email}`}</option>
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Início</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Fim</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-6 flex items-end justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">Buscar</button>
            <button type="button" onClick={clearFilters} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">Limpar filtros</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600">Itens por página</label>
            <select
              value={filters.limit}
              onChange={e => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
              className="border border-slate-300 rounded-lg px-2 py-1 text-sm"
            >
              {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">CPF/CNPJ</th>
                <th className="px-6 py-3 text-left">Cidade</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Criado em</th>
                <th className="px-6 py-3 text-left">Representante</th>
                <th className="px-6 py-3 text-left">Comissão</th>
                <th className="px-6 py-3 text-left">Fatura</th>
                <th className="px-8 py-3 text-left">Status</th>
                <th className="px-8 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-slate-500">Carregando...</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && consumers.length === 0 && (
                <tr><td colSpan={11} className="px-4 py-6 text-center text-slate-500">Nenhum pendente encontrado</td></tr>
              )}
              {consumers.map((c: any) => {
                const commission = calculateCommission(c);
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-6 py-3">{c.name}</td>
                    <td className="px-6 py-3">{c.cpfCnpj}</td>
                    <td className="px-6 py-3">{c.city}</td>
                    <td className="px-6 py-3">{c.state}</td>
                    <td className="px-6 py-3">{c.consumerType}</td>
                    <td className="px-6 py-3">{new Date(c.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-3">{c.Representative ? `${c.Representative.name} (${c.Representative.email})` : '-'}</td>
                    <td className="px-6 py-3">
                      {commission ? (
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-slate-600">
                            <Zap className="h-3 w-3 mr-1" />
                            <span>{commission.kwh} kWh</span>
                          </div>
                          <div className="flex items-center text-xs text-slate-600">
                            <DollarSign className="h-3 w-3 mr-1" />
                            <span>R$ {commission.kwhPrice.toFixed(2)}/kWh</span>
                          </div>
                          <div className="flex items-center text-xs font-semibold text-green-600">
                            <Calculator className="h-3 w-3 mr-1" />
                            <span>R$ {commission.commissionValue.toFixed(2)}</span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Fórmula padrão
                          </div>
                        </div>
                      ) : c.Representative ? (
                        <div className="flex items-center text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span>Dados insuficientes</span>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">Sem representante</div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {(c.invoiceUrl && c.invoiceUrl.trim() !== '') ? (
                        <button
                          onClick={() => setInvoiceModal({ isOpen: true, consumer: c })}
                          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-all duration-200 border border-blue-200"
                          title="Ver fatura"
                        >
                          <FileText className="h-3 w-3" />
                          <span className="text-xs font-medium">Ver</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sem fatura</span>
                      )}
                    </td>
                    <td className="px-8 py-3">
                      <span className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-800">Aguardando aprovação</span>
                    </td>
                    <td className="px-8 py-3 text-right space-x-2">
                      <button
                        onClick={() => setConfirmApprove({ open: true, id: c.id })}
                        disabled={approving || rejecting}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded"
                      >Aprovar</button>
                      <button
                        onClick={() => setRejectModal({ open: true, id: c.id, reason: '' })}
                        disabled={approving || rejecting}
                        className="px-3 py-1.5 bg-red-600 text-white rounded"
                      >Rejeitar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
          <div>
            Total: <strong>{pagination.total}</strong> | Página {pagination.page} de {pagination.totalPages}
          </div>
          <div className="space-x-2">
            <button
              disabled={!pagination.hasPrev}
              onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
              className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-50"
            >Anterior</button>
            <button
              disabled={!pagination.hasNext}
              onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
              className="px-3 py-1.5 border border-slate-300 rounded disabled:opacity-50"
            >Próxima</button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Rejeitar cadastro</h3>
            <p className="text-sm text-slate-600 mb-3">Informe um motivo (opcional):</p>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[100px]"
              value={rejectModal.reason}
              onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-3 py-1.5 border border-slate-300 rounded"
                onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
              >Cancelar</button>
              <button
                className="px-3 py-1.5 bg-red-600 text-white rounded disabled:opacity-50"
                disabled={rejecting}
                onClick={async () => {
                  if (rejectModal.id) await onReject(rejectModal.id, rejectModal.reason || undefined);
                  setRejectModal({ open: false, id: null, reason: '' });
                }}
              >Confirmar rejeição</button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {confirmApprove.open && (() => {
        const consumer = consumers.find((c: any) => c.id === confirmApprove.id);
        const commission = consumer ? calculateCommission(consumer) : null;
        
        return (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Aprovar Consumidor
              </h3>
              
              {consumer && (
                <div className="space-y-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Informações do Consumidor</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <div><strong>Nome:</strong> {consumer.name}</div>
                      <div><strong>CPF/CNPJ:</strong> {consumer.cpfCnpj}</div>
                      <div><strong>Localização:</strong> {consumer.city}, {consumer.state}</div>
                      <div><strong>Consumo:</strong> {consumer.averageMonthlyConsumption} kWh/mês</div>
                      {consumer.Representative && (
                        <div><strong>Representante:</strong> {consumer.Representative.name}</div>
                      )}
                    </div>
                  </div>

                  {/* Fatura */}
                  {consumer.invoiceUrl && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Fatura Anexada
                      </h4>
                      <button
                        onClick={() => {
                          setConfirmApprove({ open: false, id: null });
                          setInvoiceModal({ isOpen: true, consumer });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Clique para ver a fatura
                      </button>
                    </div>
                  )}

                  {commission ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-800 mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Cálculo de Comissão
                      </h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <div className="flex justify-between">
                          <span>kWh do consumidor:</span>
                          <span className="font-medium">{commission.kwh} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Valor do kWh:</span>
                          <span className="font-medium">R$ {commission.kwhPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fórmula:</span>
                          <span className="font-medium">Padrão (K * 0.865 * P) / 2</span>
                        </div>
                        <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                          <span className="font-semibold">Comissão calculada:</span>
                          <span className="font-bold text-green-800">R$ {commission.commissionValue.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-green-600 bg-green-100 rounded px-2 py-1">
                        ✓ Uma comissão será criada automaticamente após a aprovação
                      </div>
                    </div>
                  ) : consumer.Representative ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Comissão Indisponível
                      </h4>
                      <p className="text-sm text-amber-700">
                        Não foi possível calcular a comissão devido a dados insuficientes. 
                        O consumidor será aprovado, mas nenhuma comissão será gerada automaticamente.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-800 mb-2">Sem Representante</h4>
                      <p className="text-sm text-slate-600">
                        Este consumidor não possui representante vinculado. Nenhuma comissão será gerada.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => setConfirmApprove({ open: false, id: null })}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
                  disabled={approving}
                  onClick={async () => {
                    if (confirmApprove.id) await onApprove(confirmApprove.id);
                    setConfirmApprove({ open: false, id: null });
                  }}
                >
                  {approving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Aprovando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirmar Aprovação</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Fatura */}
      <InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, consumer: null })}
        consumerId={invoiceModal.consumer?.id}
        invoiceUrl={invoiceModal.consumer?.invoiceUrl}
        invoiceFileName={invoiceModal.consumer?.invoiceFileName}
        invoiceUploadedAt={invoiceModal.consumer?.invoiceUploadedAt}
        invoiceScannedData={invoiceModal.consumer?.invoiceScannedData}
        consumerName={invoiceModal.consumer?.name}
      />
    </div>
  );
}


