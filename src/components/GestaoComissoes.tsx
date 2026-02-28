import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Users,
  CheckCircle,
  Clock,
  X,
  XCircle,
  Download,
  RefreshCw,
  AlertCircle,
  Loader,
  User,
  Zap,
  Calendar,
  TrendingUp,
  BarChart3,
  FileText,
  Upload,
  Eye,
  Trash2,
  LayoutGrid,
  List,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useCommissions } from '../hooks/useCommissions';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { useToast } from '../hooks/useToast';
import { Commission, CommissionStatus } from '../types';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Modal, { ModalFooter } from './ui/Modal';
import LoadingSpinner from './common/LoadingSpinner';
import UploadPaymentProofModal from './UploadPaymentProofModal';
import DocumentPreviewModal from './ui/DocumentPreviewModal';
import { commissionService } from '../types/services/commissionService';

export default function GestaoComissoes() {
  const {
    commissions,
    loading,
    error,
    updateFilters,
    clearFilters,
    markAsPaid,
    generateCommissionsForExisting,
    uploadPaymentProof,
    deletePaymentProof,
    refetch
  } = useCommissions();
  const { representantes } = useRepresentantesComerciais();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRepresentative, setFilterRepresentative] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  // Estados para upload de comprovante
  const [uploadModal, setUploadModal] = useState<{
    isOpen: boolean;
    commission: Commission | null;
  }>({
    isOpen: false,
    commission: null
  });

  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  // Aplicar filtros
  useEffect(() => {
    const filters = {
      representativeId: filterRepresentative || undefined,
      status: filterStatus as CommissionStatus || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined
    };
    updateFilters(filters);
  }, [filterRepresentative, filterStatus, filterStartDate, filterEndDate, updateFilters]);

  // Filtrar por termo de busca
  const filteredCommissions = commissions.filter(commission => {
    // Busca tridimensional
    const searchMatch = !searchTerm || (
      commission.representative?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.consumer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      commission.consumer?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const repMatch = !filterRepresentative || commission.representative?.id === filterRepresentative;
    const statusMatch = !filterStatus || commission.status === filterStatus;

    let startMatch = true;
    let endMatch = true;

    if (filterStartDate) {
      startMatch = new Date(commission.createdAt) >= new Date(filterStartDate + 'T00:00:00');
    }
    if (filterEndDate) {
      endMatch = new Date(commission.createdAt) <= new Date(filterEndDate + 'T23:59:59');
    }

    return searchMatch && repMatch && statusMatch && startMatch && endMatch;
  });

  const groupedCommissions = useMemo(() => {
    const map = new Map<string, any>();
    filteredCommissions.forEach(c => {
      if (!c.representative) return;
      if (!map.has(c.representative.id)) {
        map.set(c.representative.id, {
          representative: c.representative,
          totalCommissions: 0,
          totalValue: 0,
          pendingValue: 0,
          paidValue: 0,
          commissions: []
        });
      }
      const group = map.get(c.representative.id)!;
      group.totalCommissions++;
      group.totalValue += (c.commissionValue || 0);
      if (c.status === CommissionStatus.PENDING || c.status === CommissionStatus.CALCULATED) {
        group.pendingValue += (c.commissionValue || 0);
      } else if (c.status === CommissionStatus.PAID) {
        group.paidValue += (c.commissionValue || 0);
      }
      group.commissions.push(c);
    });
    return Array.from(map.values()).sort((a, b) => b.totalValue - a.totalValue);
  }, [filteredCommissions]);

  const displayCommissions = selectedRepId
    ? filteredCommissions.filter(c => c.representative?.id === selectedRepId)
    : filteredCommissions;

  const handleMarkAsPaid = async (id: string) => {
    if (confirm('Tem certeza que deseja marcar esta comissão como paga?')) {
      try {
        await markAsPaid(id);
        toast.showSuccess('Comissão marcada como paga com sucesso!');
      } catch (error) {
        toast.showError('Erro ao marcar comissão como paga');
      }
    }
  };

  const handleGenerateCommissions = async () => {
    try {
      setGenerating(true);
      const result = await generateCommissionsForExisting();

      if (result.totalProcessed === 0) {
        toast.showError('Nenhum consumidor elegível encontrado para gerar comissões. Verifique se há consumidores aprovados com representantes vinculados.');
      } else if (result.successful > 0) {
        toast.showSuccess(`${result.successful} comissões geradas com sucesso! ${result.errors > 0 ? `${result.errors} erros encontrados.` : ''}`);
      } else {
        toast.showError('Erro ao gerar comissões. Verifique os logs para mais detalhes.');
      }

      setShowGenerateModal(false);
      refetch();
    } catch (error) {
      toast.showError('Erro ao gerar comissões');
    } finally {
      setGenerating(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterRepresentative('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedRepId(null);
    clearFilters();
  };

  const exportCommissions = () => {
    const csvContent = [
      ['Representante', 'Consumidor', 'kWh', 'Valor', 'Status', 'Data de Criação'],
      ...displayCommissions.map(commission => [
        commission.representative.name,
        commission.consumer.name,
        commission.kwh.toString(),
        commission.commissionValue.toFixed(2),
        commission.status === CommissionStatus.PENDING ? 'Pendente' : 'Pago',
        new Date(commission.createdAt).toLocaleDateString('pt-BR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comissoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.showSuccess('Comissões exportadas com sucesso!');
  };

  // Funções de gerenciamento de comprovantes
  const handleUploadProof = async (file: File) => {
    if (!uploadModal.commission) return;

    try {
      await uploadPaymentProof(uploadModal.commission.id, file);
      toast.showSuccess('Comprovante anexado e comissão marcada como paga!');
      setUploadModal({ isOpen: false, commission: null });
    } catch (error: any) {
      toast.showError(error.message || 'Erro ao anexar comprovante');
      throw error;
    }
  };

  const handleViewProof = async (commissionId: string) => {
    try {
      const url = commissionService.getPaymentProofUrl(commissionId);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao obter comprovante');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewModal({ isOpen: true, url: blobUrl, title: 'Comprovante de Pagamento' });
    } catch (error) {
      toast.showError('Não foi possível exibir o comprovante na tela. Abrindo em nova aba...');
      const fallbackUrl = commissionService.getPaymentProofUrl(commissionId);
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleDeleteProof = async (commissionId: string) => {
    if (!confirm('Tem certeza que deseja remover o comprovante de pagamento?')) {
      return;
    }

    try {
      await deletePaymentProof(commissionId);
      toast.showSuccess('Comprovante removido com sucesso!');
    } catch (error: any) {
      toast.showError(error.message || 'Erro ao remover comprovante');
    }
  };

  // Estatísticas
  const stats = {
    total: filteredCommissions.length,
    pending: filteredCommissions.filter(c => c.status === CommissionStatus.PENDING || c.status === CommissionStatus.CALCULATED).length,
    paid: filteredCommissions.filter(c => c.status === CommissionStatus.PAID).length,
    totalValue: filteredCommissions.reduce((acc, c) => acc + c.commissionValue, 0),
    pendingValue: filteredCommissions
      .filter(c => c.status === CommissionStatus.PENDING || c.status === CommissionStatus.CALCULATED)
      .reduce((acc, c) => acc + c.commissionValue, 0)
  };

  if (loading && commissions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-md">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Erro ao carregar comissões</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <Button onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
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
              <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Gestão de Comissões
                </h1>
                <p className="text-slate-500 font-medium text-sm font-display">
                  Gerencie comissões de representantes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowGenerateModal(true)}
                className="bg-white text-slate-700 hover:text-slate-900"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Comissões
              </Button>
              <Button
                onClick={exportCommissions}
                showArrow
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 font-display">Total</p>
              <p className="text-3xl font-bold text-slate-900 font-display mt-1">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 font-display">Pendentes</p>
              <p className="text-3xl font-bold text-amber-500 font-display mt-1">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 font-display">Pagas</p>
              <p className="text-3xl font-bold text-emerald-600 font-display mt-1">{stats.paid}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 font-display">Valor Total</p>
              <p className="text-2xl font-bold text-purple-600 font-display mt-1">
                R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                R$ {stats.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="md:col-span-2">
              <Input
                label="Buscar"
                placeholder="Representante ou consumidor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5" />}
              />
            </div>

            <Select
              label="Representante"
              value={filterRepresentative}
              onChange={(e) => setFilterRepresentative(e.target.value)}
            >
              <option value="">Todos</option>
              {representantes.map(rep => (
                <option key={rep.id} value={rep.id}>{rep.name}</option>
              ))}
            </Select>

            <Select
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value={CommissionStatus.PENDING}>Pendente</option>
              <option value={CommissionStatus.CALCULATED}>Calculada</option>
              <option value={CommissionStatus.PAID}>Pago</option>
              <option value={CommissionStatus.CANCELLED}>Cancelado</option>
            </Select>

            <Input
              label="Data Inicial"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />

            <Input
              label="Data Final"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleClearFilters}
              variant="secondary"
              className="bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Toggle de Visualização & Botão Voltar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          {selectedRepId ? (
            <button
              onClick={() => setSelectedRepId(null)}
              className="flex items-center w-fit text-slate-600 hover:text-accent font-medium py-2 px-3 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Visão Geral
            </button>
          ) : (
            <div className="bg-white rounded-lg p-1 shadow-sm border border-slate-200 inline-flex w-fit ml-auto">
              <button
                onClick={() => setViewMode('grouped')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-all ${viewMode === 'grouped' ? 'bg-accent text-white shadow' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
              >
                <LayoutGrid className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Por Representante</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md flex justify-center items-center transition-all ${viewMode === 'list' ? 'bg-accent text-white shadow' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
              >
                <List className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Lista Geral</span>
              </button>
            </div>
          )}
        </div>

        {/* View content based on mode */}
        {viewMode === 'grouped' && !selectedRepId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupedCommissions.map(group => (
              <div
                key={group.representative.id}
                onClick={() => setSelectedRepId(group.representative.id)}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-accent/30 transition-all duration-300 cursor-pointer group/card relative overflow-hidden"
              >
                <div className="absolute inset-x-0 -bottom-2 h-2 bg-gradient-to-r from-accent to-accent-secondary blur-sm opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 font-bold text-lg border border-white shadow-inner group-hover/card:shadow-accent/20 transition-shadow">
                      {group.representative.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 line-clamp-1 group-hover/card:text-accent transition-colors">
                        {group.representative.name}
                      </h3>
                      <p className="text-sm font-medium text-slate-500">{group.totalCommissions} comissões</p>
                    </div>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover/card:bg-accent/10 transition-colors">
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover/card:text-accent group-hover/card:translate-x-0.5 transition-all" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Valor Total</span>
                    <span className="font-bold text-slate-900 text-base">R$ {group.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                      <span className="text-amber-600/80 text-xs font-semibold flex items-center mb-1"><Clock className="h-3 w-3 mr-1" /> Pendente</span>
                      <span className="font-bold text-amber-700 block">R$ {group.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                      <span className="text-emerald-600/80 text-xs font-semibold flex items-center mb-1"><CheckCircle className="h-3 w-3 mr-1" /> Pago</span>
                      <span className="font-bold text-emerald-700 block">R$ {group.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {groupedCommissions.length === 0 && !loading && (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 font-display mb-2">Nenhum representante encontrado</h3>
                <p className="text-slate-500 font-display">Ajuste os filtros de busca para ver resultados.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Representante</th>
                    <th className="px-6 py-4 whitespace-nowrap">Consumidor</th>
                    <th className="px-6 py-4 whitespace-nowrap">kWh</th>
                    <th className="px-6 py-4 whitespace-nowrap">Valor</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">Comprovante</th>
                    <th className="px-6 py-4 whitespace-nowrap">Data</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayCommissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm ring-2 ring-white">
                            {commission.representative?.name?.charAt(0) || 'R'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 font-display">{commission.representative?.name || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm ring-2 ring-white">
                            {commission.consumer?.name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 font-display">{commission.consumer?.name || 'N/A'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-semibold text-slate-900">
                            {(() => {
                              const kwhValue = commission.kwh || commission.consumer?.averageMonthlyConsumption || 0;
                              return kwhValue > 0 ? kwhValue.toLocaleString() : '0';
                            })()}
                          </span>
                          <span className="text-xs text-slate-500">kWh</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            R$ {commission.commissionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                          </p>
                          <p className="text-xs text-slate-500">R$ {commission.kwhPrice.toFixed(2)}/kWh</p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {(() => {
                          const statusConfig = {
                            [CommissionStatus.PENDING]: { label: 'Pendente', color: 'amber', icon: Clock },
                            [CommissionStatus.PAID]: { label: 'Pago', color: 'emerald', icon: CheckCircle },
                            [CommissionStatus.CANCELLED]: { label: 'Cancelado', color: 'red', icon: X },
                            [CommissionStatus.CALCULATED]: { label: 'Calculada', color: 'blue', icon: TrendingUp }
                          };

                          const config = statusConfig[commission.status] || { label: commission.status || 'Desconhecido', color: 'slate', icon: AlertCircle };
                          const Icon = config.icon;

                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200`}>
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Coluna de Comprovante */}
                      <td className="px-6 py-4 text-center">
                        {commission.paymentProofUrl ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewProof(commission.id)}
                              className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Visualizar comprovante"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProof(commission.id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Remover comprovante"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-900">
                            {new Date(commission.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {(commission.status === CommissionStatus.PENDING || commission.status === CommissionStatus.CALCULATED) ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setUploadModal({ isOpen: true, commission })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Anexar Comprovante
                            </Button>
                          </div>
                        ) : commission.status === CommissionStatus.PAID ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle className="h-3 w-3" />
                              Paga
                            </span>
                            {!commission.paymentProofUrl && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setUploadModal({ isOpen: true, commission })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700"
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Anexar
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCommissions.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2 font-display">Nenhuma comissão encontrada</h3>
                <p className="text-slate-500 max-w-sm mx-auto font-display">
                  {searchTerm || filterRepresentative || filterStatus || filterStartDate || filterEndDate || selectedRepId
                    ? 'Tente ajustar os filtros de busca para encontrar as comissões desejadas.'
                    : 'Nenhuma comissão foi gerada ainda.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Geração de Comissões */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Gerar Comissões"
        description="Gerar comissões para consumidores existentes"
        size="md"
        headerVariant="brand"
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800 font-display">Atenção</h4>
              <p className="text-sm text-yellow-700 mt-1 font-display">
                Esta ação irá gerar comissões para todos os consumidores que possuem representantes vinculados e ainda não possuem comissões geradas.
              </p>
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowGenerateModal(false)}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateCommissions}
            disabled={generating}
            showArrow
            className="rounded-full"
          >
            {generating ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Gerar Comissões
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal de Upload de Comprovante */}
      {uploadModal.commission && (
        <UploadPaymentProofModal
          isOpen={uploadModal.isOpen}
          onClose={() => setUploadModal({ isOpen: false, commission: null })}
          onUpload={handleUploadProof}
          commissionId={uploadModal.commission.id}
          commissionValue={uploadModal.commission.commissionValue}
          representativeName={uploadModal.commission.representative.name}
        />
      )}

      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
        documentUrl={previewModal.url}
        documentTitle={previewModal.title}
      />
    </div>
  );
}
