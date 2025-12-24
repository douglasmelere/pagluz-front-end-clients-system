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

  // Debug logs
  console.log('GestaoComissoes - commissions:', commissions);
  console.log('GestaoComissoes - loading:', loading);
  console.log('GestaoComissoes - error:', error);
  console.log('GestaoComissoes - pending commissions:', commissions?.filter(c => c.status === CommissionStatus.PENDING));
  console.log('GestaoComissoes - CommissionStatus enum:', CommissionStatus);

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
    console.log('handleGenerateCommissions - Iniciando...');
    try {
      setGenerating(true);
      console.log('handleGenerateCommissions - Chamando generateCommissionsForExisting...');
      const result = await generateCommissionsForExisting();
      console.log('handleGenerateCommissions - Resultado:', result);
      
      // Verificar se foram processados consumidores
      if (result.totalProcessed === 0) {
        toast.showError('Nenhum consumidor elegível encontrado para gerar comissões. Verifique se há consumidores aprovados com representantes vinculados.');
      } else if (result.successful > 0) {
        toast.showSuccess(`${result.successful} comissões geradas com sucesso! ${result.errors > 0 ? `${result.errors} erros encontrados.` : ''}`);
      } else {
        toast.showError('Erro ao gerar comissões. Verifique os logs para mais detalhes.');
      }
      
      setShowGenerateModal(false);
      // Recarregar a lista de comissões
      refetch();
    } catch (error) {
      console.error('handleGenerateCommissions - Erro:', error);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando comissões...</p>
        </div>
      </div>
    );
  }

  // Se há erro, mostrar mensagem de erro
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Erro ao carregar comissões</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
        <div className="w-full px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <DollarSign className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Gestão de Comissões</h1>
                  <p className="text-slate-200 text-lg mt-1">Gerencie comissões de representantes</p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowGenerateModal(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border border-white/20"
              >
                <RefreshCw className="h-5 w-5" />
                <span className="font-semibold">Gerar Comissões</span>
              </button>
              <button
                onClick={exportCommissions}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border border-white/20"
              >
                <Download className="h-5 w-5" />
                <span className="font-semibold">Exportar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Total de Comissões</p>
                <p className="text-4xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Pendentes</p>
                <p className="text-4xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Pagas</p>
                <p className="text-4xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Valor Total</p>
                <p className="text-4xl font-bold text-purple-600">R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-500">R$ {stats.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendentes</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por representante ou consumidor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-400" />
                <select
                  value={filterRepresentative}
                  onChange={(e) => setFilterRepresentative(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 min-w-[180px]"
                >
                  <option value="">Todos os Representantes</option>
                  {representantes.map(rep => (
                    <option key={rep.id} value={rep.id}>
                      {rep.name}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 min-w-[140px]"
              >
                <option value="">Todos os Status</option>
                <option value={CommissionStatus.PENDING}>Pendente</option>
                <option value={CommissionStatus.CALCULATED}>Calculada</option>
                <option value={CommissionStatus.PAID}>Pago</option>
                <option value={CommissionStatus.CANCELLED}>Cancelado</option>
              </select>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50"
                placeholder="Data inicial"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50"
                placeholder="Data final"
              />
              <button
                onClick={handleClearFilters}
                className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <X className="h-5 w-5" />
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>


        {/* Tabela de Comissões */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300">
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Representante</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Consumidor</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">kWh</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Data</th>
                  <th className="px-8 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCommissions.map((commission) => (
                  <tr key={commission.id} className="hover:bg-slate-50 transition-all duration-200 group">
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {commission.representative.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {commission.representative.name}
                          </div>
                          <div className="text-xs text-slate-500">{commission.representative.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                          {commission.consumer.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                            {commission.consumer.name}
                          </div>
                          <div className="text-xs text-slate-500">{commission.consumer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                        <span className="text-sm font-semibold text-slate-900">
                          {(() => {
                            // Se kwh é 0, null ou undefined, tentar usar averageMonthlyConsumption do consumer
                            const kwhValue = commission.kwh || 
                              commission.consumer.averageMonthlyConsumption || 
                              0;
                            
                            return kwhValue > 0 ? kwhValue.toLocaleString() : '0';
                          })()}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">kWh</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="text-sm font-bold text-slate-900">
                        R$ {commission.commissionValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </div>
                      <div className="text-xs text-slate-500">
                        R$ {commission.kwhPrice.toFixed(2)}/kWh
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {(() => {
                        console.log('Commission status debug:', {
                          id: commission.id,
                          status: commission.status,
                          statusType: typeof commission.status,
                          PENDING: CommissionStatus.PENDING,
                          PAID: CommissionStatus.PAID,
                          CANCELLED: CommissionStatus.CANCELLED
                        });
                        
                        if (commission.status === CommissionStatus.PENDING) {
                          return (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                              <Clock className="h-3 w-3" />
                              <span>Pendente</span>
                            </span>
                          );
                        } else if (commission.status === CommissionStatus.PAID) {
                          return (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                              <CheckCircle className="h-3 w-3" />
                              <span>Pago</span>
                            </span>
                          );
                        } else if (commission.status === CommissionStatus.CANCELLED) {
                          return (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                              <X className="h-3 w-3" />
                              <span>Cancelado</span>
                            </span>
                          );
                        } else if (commission.status === CommissionStatus.CALCULATED) {
                          return (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                              <TrendingUp className="h-3 w-3" />
                              <span>Calculada</span>
                            </span>
                          );
                        } else {
                          // Status desconhecido - mostrar o valor real
                          return (
                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                              <AlertCircle className="h-3 w-3" />
                              <span>{commission.status || 'Desconhecido'}</span>
                            </span>
                          );
                        }
                      })()}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                        <span className="text-sm text-slate-900">
                          {new Date(commission.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {(() => {
                        console.log('Commission action debug:', {
                          id: commission.id,
                          status: commission.status,
                          statusType: typeof commission.status,
                          PENDING: CommissionStatus.PENDING,
                          isPending: commission.status === CommissionStatus.PENDING
                        });
                        
                        if (commission.status === CommissionStatus.PENDING || commission.status === CommissionStatus.CALCULATED) {
                          return (
                            <button
                              onClick={() => handleMarkAsPaid(commission.id)}
                              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Marcar Pago</span>
                            </button>
                          );
                        } else {
                          return (
                            <span className="text-sm text-gray-500">
                              {commission.status === CommissionStatus.PAID ? 'Já paga' : 'Ação não disponível'}
                            </span>
                          );
                        }
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCommissions.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <DollarSign className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhuma comissão encontrada</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchTerm || filterRepresentative || filterStatus || filterStartDate || filterEndDate
                  ? 'Tente ajustar os filtros de busca para encontrar as comissões desejadas.' 
                  : 'Nenhuma comissão foi gerada ainda.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Geração de Comissões */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-xl font-bold">Gerar Comissões</h2>
                  <p className="text-blue-100 mt-1">Gerar comissões para consumidores existentes</p>
                </div>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-800">Atenção</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Esta ação irá gerar comissões para todos os consumidores que possuem representantes vinculados e ainda não possuem comissões geradas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateCommissions}
                  disabled={generating}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl transition-all duration-200 font-medium flex items-center space-x-2"
                >
                  {generating ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>{generating ? 'Gerando...' : 'Gerar Comissões'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2 shadow-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
    </div>
  );
}
