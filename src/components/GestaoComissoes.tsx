import { useState, useEffect } from 'react';
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
  BarChart3
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

export default function GestaoComissoes() {
  const {
    commissions,
    loading,
    error,
    updateFilters,
    clearFilters,
    markAsPaid,
    generateCommissionsForExisting,
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
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      commission.representative.name.toLowerCase().includes(searchLower) ||
      commission.consumer.name.toLowerCase().includes(searchLower) ||
      commission.consumer.email.toLowerCase().includes(searchLower)
    );
  });

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
    clearFilters();
  };

  const exportCommissions = () => {
    const csvContent = [
      ['Representante', 'Consumidor', 'kWh', 'Valor', 'Status', 'Data de Criação'],
      ...filteredCommissions.map(commission => [
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

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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

        {/* Tabela de Comissões */}
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
                  <th className="px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm ring-2 ring-white">
                          {commission.representative.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 font-display">{commission.representative.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{commission.representative.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm ring-2 ring-white">
                          {commission.consumer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 font-display">{commission.consumer.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{commission.consumer.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {(() => {
                            const kwhValue = commission.kwh || commission.consumer.averageMonthlyConsumption || 0;
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
                        <Button
                          size="sm"
                          onClick={() => handleMarkAsPaid(commission.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Marcar Pago
                        </Button>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {commission.status === CommissionStatus.PAID ? 'Já paga' : '-'}
                        </span>
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
                {searchTerm || filterRepresentative || filterStatus || filterStartDate || filterEndDate
                  ? 'Tente ajustar os filtros de busca para encontrar as comissões desejadas.'
                  : 'Nenhuma comissão foi gerada ainda.'}
              </p>
            </div>
          )}
        </div>
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
    </div>
  );
}
