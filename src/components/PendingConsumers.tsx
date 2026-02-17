import React, { useEffect, useMemo, useState } from 'react';
import { clienteConsumidorService } from '../types/services/clienteConsumidorService';
import { representanteComercialService } from '../types/services/representanteComercialService';
import { settingsService } from '../types/services/settingsService';
import { useApi, useApiMutation } from '../hooks/useApi';
import { useApp } from '../context/AppContext';
import { useToast } from '../hooks/useToast';
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  UserCheck
} from 'lucide-react';
import InvoiceModal from './admin/InvoiceModal';
import Modal, { ModalFooter } from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Badge from './ui/Badge';

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
      logout().catch(() => { });
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
        const price = await settingsService.getKwhPrice();
        setKwhPrice(price);
      } catch (error) {
        // Silently fail - price will default to 0
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
      setConfirmApprove({ open: false, id: null });
    } catch (error) {
      toast.showError('Erro ao aprovar consumidor');
    }
  };

  const onReject = async (id: string, reason?: string) => {
    try {
      await rejectMutate(() => clienteConsumidorService.reject(id, reason));
      await refetch();
      toast.showSuccess('Consumidor rejeitado com sucesso');
      setRejectModal({ open: false, id: null, reason: '' });
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

    // kWh da fatura
    const kwh = consumer.averageMonthlyConsumption;

    // Determinar a taxa de comissionamento baseada nas faixas de kWh
    let commissionRate = 0;
    if (kwh >= 1500) {
      commissionRate = 0.375; // 37.5%
    } else if (kwh >= 1000) {
      commissionRate = 0.35; // 35%
    } else if (kwh >= 600) {
      commissionRate = 0.30; // 30%
    } else {
      // Abaixo de 600 kWh não gera comissão
      return null;
    }

    // Cálculo: kWh da fatura × Preço kWh × Taxa de comissionamento
    const commissionValue = kwh * kwhPrice * commissionRate;

    return {
      kwh,
      commissionRate: commissionRate * 100, // Converter para porcentagem para exibição
      kwhPrice,
      commissionValue: Math.round(commissionValue * 100) / 100 // Round to 2 decimal places
    };
  };

  const pagination = data?.pagination || { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
  const consumers = data?.consumers || [];

  const isOperatorPlus = user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(((user.role as unknown as string) || '').toUpperCase());
  if (!isOperatorPlus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Permissão Insuficiente</h2>
        <p className="text-slate-500 max-w-md">
          Você não possui as permissões necessárias para acessar a área de aprovações pendentes.
        </p>
      </div>
    );
  }

  // Helper to render Approve Confirmation Content
  const renderApproveContent = () => {
    const consumer = consumers.find((c: any) => c.id === confirmApprove.id);
    const commission = consumer ? calculateCommission(consumer) : null;

    if (!consumer) return null;

    return (
      <div className="space-y-6">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
          <h4 className="font-medium text-slate-900 mb-3 flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-accent" />
            Informações do Consumidor
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Nome</span>
              <span className="text-slate-900 font-medium">{consumer.name}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Documento</span>
              <span className="text-slate-900 font-medium">{consumer.cpfCnpj}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Localização</span>
              <span className="text-slate-900 font-medium">{consumer.city}, {consumer.state}</span>
            </div>
            <div>
              <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Consumo</span>
              <span className="text-slate-900 font-medium">{consumer.averageMonthlyConsumption} kWh</span>
            </div>
            {consumer.Representative && (
              <div className="col-span-2">
                <span className="block text-xs text-slate-500 uppercase tracking-wider font-semibold">Representante</span>
                <span className="text-slate-900 font-medium">{consumer.Representative.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fatura */}
        {consumer.invoiceUrl && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-3">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Fatura Anexada</h4>
                <p className="text-xs text-blue-600">Documento disponível para visualização</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
              onClick={() => {
                setInvoiceModal({ isOpen: true, consumer });
              }}
            >
              Ver Fatura
            </Button>
          </div>
        )}

        {commission ? (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
            <h4 className="font-medium text-emerald-800 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Cálculo de Comissão
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">kWh da Fatura</span>
                <span className="font-medium text-emerald-900">{commission.kwh} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Preço kWh (Sistema)</span>
                <span className="font-medium text-emerald-900">R$ {commission.kwhPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-700">Taxa de Comissionamento</span>
                <span className="font-medium text-emerald-900">{commission.commissionRate}%</span>
              </div>
              <div className="h-px bg-emerald-200/50 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-emerald-800">Comissão Prevista</span>
                <span className="text-lg font-bold text-emerald-700">R$ {commission.commissionValue.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-100/50 p-2 rounded-lg">
              <CheckCircle className="h-3 w-3" />
              Uma comissão será gerada automaticamente.
            </div>
          </div>
        ) : consumer.Representative ? (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Comissão Indisponível</h4>
              <p className="text-sm text-amber-700 mt-1">
                Dados insuficientes para cálculo automático. O consumidor será aprovado sem gerar comissão.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-slate-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-slate-700">Sem Representante</h4>
              <p className="text-sm text-slate-500 mt-1">
                Consumidor sem vínculo. Nenhuma comissão será gerada.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900">Pendentes de Aprovação</h1>
                <p className="text-slate-500 font-medium text-sm">Revise e aprove novos consumidores</p>
              </div>
            </div>

            {/* Stats Summary could go here */}
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Select
              label="UF"
              value={filters.state || ''}
              onChange={e => setFilters(prev => ({ ...prev, state: e.target.value || undefined }))}
            >
              <option value="">Todas</option>
              {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </Select>

            <Input
              label="Cidade"
              placeholder="Buscar cidade..."
              value={filters.city || ''}
              onChange={e => setFilters(prev => ({ ...prev, city: e.target.value || undefined }))}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />

            <div className="lg:col-span-2">
              <Input
                label="Representante"
                list="representatives-list"
                placeholder="Nome ou email..."
                value={filters.representativeId || ''}
                onChange={e => setFilters(prev => ({ ...prev, representativeId: e.target.value || undefined }))}
              />
              <datalist id="representatives-list">
                {(representativesData || []).map((r: any) => (
                  <option key={r.id} value={r.id}>{`${r.name} - ${r.email}`}</option>
                ))}
              </datalist>
            </div>

            <Input
              label="Data Início"
              type="date"
              value={filters.startDate || ''}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value || undefined }))}
            />

            <Input
              label="Data Fim"
              type="date"
              value={filters.endDate || ''}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value || undefined }))}
            />

            <div className="md:col-span-4 lg:col-span-6 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Itens por página:</span>
                <select
                  value={filters.limit}
                  onChange={e => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="border border-slate-200 rounded-lg text-sm p-1 bg-slate-50 focus:ring-accent focus:border-accent outline-none"
                >
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={clearFilters} size="sm">
                  Limpar Filtros
                </Button>
                <Button type="submit" size="sm" showArrow>
                  Buscar Resultador
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Consumidor</th>
                  <th className="px-6 py-4 whitespace-nowrap">Localização</th>
                  <th className="px-6 py-4 whitespace-nowrap">Tipo</th>
                  <th className="px-6 py-4 whitespace-nowrap">Representante</th>
                  <th className="px-6 py-4 whitespace-nowrap">Comissão (Est.)</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Fatura</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Carregando dados...</td></tr>
                )}
                {!loading && error && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-red-500 font-medium">{error}</td></tr>
                )}
                {!loading && !error && consumers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Search className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 font-display">Nenhum registro encontrado</h3>
                      <p className="text-slate-500 mt-1">Tente ajustar seus filtros de busca.</p>
                    </td>
                  </tr>
                )}
                {consumers.map((c: any) => {
                  const commission = calculateCommission(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{c.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{c.cpfCnpj}</span>
                          <span className="text-xs text-slate-400 mt-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="block text-slate-700">{c.city} - {c.state}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                          {c.consumerType}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {c.Representative ? (
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-medium">{c.Representative.name}</span>
                            <span className="text-xs text-slate-500">{c.Representative.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Sem vínculo</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {commission ? (
                          <div className="flex flex-col">
                            <span className="text-green-700 font-bold font-mono">R$ {commission.commissionValue.toFixed(2)}</span>
                            <span className="text-xs text-slate-500">{commission.kwh} kWh</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {c.invoiceUrl ? (
                          <button
                            onClick={() => setInvoiceModal({ isOpen: true, consumer: c })}
                            className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Visualizar fatura"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setRejectModal({ open: true, id: c.id, reason: '' })}
                            title="Rejeitar"
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setConfirmApprove({ open: true, id: c.id })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                            title="Aprovar"
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Mostrando <span className="font-medium text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> até <span className="font-medium text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de <span className="font-medium text-slate-900">{pagination.total}</span> registros
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!pagination.hasPrev}
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-slate-700 px-3">
                  Página {pagination.page} de {pagination.totalPages}
                </span>

                <button
                  disabled={!pagination.hasNext}
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: null, reason: '' })}
        title="Rejeitar Cadastro"
        description="Esta ação enviará o cadastro de volta para revisão ou cancelamento."
        size="md"
        headerVariant="default"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
            <p className="text-sm text-red-800">
              Ao rejeitar, o representante será notificado. Certifique-se de fornecer um motivo claro.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Motivo da Rejeição (Opcional)</label>
            <textarea
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-slate-900 min-h-[120px] resize-none outline-none"
              placeholder="Descreva o motivo da rejeição..."
              value={rejectModal.reason}
              onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRejectModal({ open: false, id: null, reason: '' })} className="rounded-full">
            Cancelar
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white rounded-full border-red-600"
            onClick={async () => {
              if (rejectModal.id) await onReject(rejectModal.id, rejectModal.reason || undefined);
            }}
            isLoading={rejecting}
          >
            Confirmar Rejeição
          </Button>
        </ModalFooter>
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={confirmApprove.open}
        onClose={() => setConfirmApprove({ open: false, id: null })}
        title="Confirmar Aprovação"
        description="Revise os dados antes de aprovar o consumidor."
        size="lg"
        headerVariant="brand"
      >
        {renderApproveContent()}

        <ModalFooter>
          <Button variant="secondary" onClick={() => setConfirmApprove({ open: false, id: null })} className="rounded-full">
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (confirmApprove.id) await onApprove(confirmApprove.id);
            }}
            isLoading={approving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full border-transparent"
            showArrow
          >
            Confirmar e Aprovar
          </Button>
        </ModalFooter>
      </Modal>

      {/* Invoice Modal */}
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
