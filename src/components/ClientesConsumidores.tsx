import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  X,
  Users,
  Link,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader,
  Factory,
  Wind,
  Droplet,
  Leaf,
  Sun,
  UserCheck,
  Home,
  MessageSquare,
  FileText,
  Activity,
  Phone,
  Mail,
  MapPin,
  TrendingDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useToast } from '../hooks/useToast';
import { useClientesConsumidores } from '../hooks/useClientesConsumidores';
import { useClientesGeradores } from '../hooks/useClientesGeradores';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { useCommissions } from '../hooks/useCommissions';
import { api } from '../types/services/api';
import { clienteConsumidorService } from '../types/services/clienteConsumidorService';
import { applyPhoneMask, applyCepMask, applyDocumentMask, isValidEmail, isValidPhone, isValidCep, isValidCpf, isValidCnpj } from '../utils/masks';

import { Consumer, ConsumerStatus, Generator, DocumentType } from '../types';
import InvoiceView from './admin/InvoiceView';
import InvoiceModal from './admin/InvoiceModal';
import ConsumerList from './ConsumerList';
import Modal, { ModalFooter } from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

export default function ClientesConsumidores() {
  const toast = useToast();
  const {
    clientes: clientesConsumidores,
    loading,
    createCliente,
    updateCliente,
    allocateToGenerator,
    deallocateFromGenerator,
    clearFilters,
    refetch
  } = useClientesConsumidores();

  const { generateCommissionsForConsumer, commissions, refetch: refetchCommissions } = useCommissions();

  // Função helper para verificar se um consumidor já tem comissão gerada
  const hasCommission = (consumerId: string): boolean => {
    return commissions.some(commission => commission.consumerId === consumerId);
  };

  // Função para gerar comissão de um consumidor específico
  const handleGenerateCommissionForConsumer = async (consumerId: string) => {
    try {
      // Verificar se já existe comissão
      if (hasCommission(consumerId)) {
        toast.showError('Este consumidor já possui uma comissão gerada.');
        return;
      }

      // Buscar dados completos do consumidor
      const consumer = clientesConsumidores.find(c => c.id === consumerId);
      if (!consumer) {
        toast.showError('Consumidor não encontrado.');
        return;
      }

      const result = await generateCommissionsForConsumer(consumerId, consumer);

      if (result.status === 'NOT_GENERATED') {
        toast.showError(`Nenhuma comissão foi gerada para "${consumer.name}". O backend retornou totalProcessed: 0, indicando que não encontrou consumidores elegíveis. Possíveis causas: 1) Representante não tem configurações de comissão, 2) Consumidor não atende critérios, 3) Backend não está processando corretamente. Use a seção "Gestão de Comissões" como alternativa.`);
      } else {
        toast.showSuccess('Comissão gerada com sucesso!');
        // Recarregar comissões após gerar
        await refetchCommissions();
      }
    } catch (error) {
      toast.showError('Erro ao gerar comissão. Tente novamente.');
    }
  };

  // Função para aprovar um consumidor individual
  const handleApproveConsumer = async (consumer: Consumer) => {
    try {
      // Confirmar ação
      const confirmed = window.confirm(`Deseja aprovar o consumidor "${consumer.name}"?`);
      if (!confirmed) {
        return;
      }

      // Chamar API real de aprovação
      await clienteConsumidorService.approve(consumer.id);

      toast.showSuccess(`Consumidor "${consumer.name}" aprovado com sucesso!`);

      // Recarregar a lista de consumidores
      await refetch();

    } catch (error) {
      toast.showError('Erro ao aprovar consumidor. Tente novamente.');
    }
  };


  const { clientes: geradores } = useClientesGeradores();
  const { representantes } = useRepresentantesComerciais();

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Consumer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterGerador, setFilterGerador] = useState<string>('todos');
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; consumer: Consumer | null }>({
    isOpen: false,
    consumer: null
  });


  // Removido useEffect que causava loop infinito

  const filteredClientes = (clientesConsumidores || []).filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = !searchTerm ||
      cliente.name.toLowerCase().includes(searchLower) ||
      cliente.cpfCnpj.includes(searchTerm) ||
      cliente.city?.toLowerCase().includes(searchLower) ||
      getGeneratorName(cliente.generatorId || '', geradores).toLowerCase().includes(searchLower);

    const statusMatch = filterStatus === 'todos' || cliente.status === filterStatus;
    const tipoMatch = filterTipo === 'todos' || cliente.consumerType === filterTipo;
    const geradorMatch = filterGerador === 'todos' || cliente.generatorId === filterGerador;

    return searchMatch && statusMatch && tipoMatch && geradorMatch;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterTipo, filterGerador]);

  // Pagination logic
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredClientes.slice(startIndex, endIndex);



  // Stats para dashboard
  const stats = {
    total: clientesConsumidores?.length || 0,
    alocados: clientesConsumidores?.filter(c => c.status === ConsumerStatus.ALLOCATED).length || 0,
    disponiveis: clientesConsumidores?.filter(c => c.status === ConsumerStatus.AVAILABLE).length || 0,
    consumoTotal: clientesConsumidores?.reduce((acc, c) => acc + c.averageMonthlyConsumption, 0) || 0
  };

  const handleEdit = (cliente: Consumer) => {
    setEditingClient(cliente);
    setShowModal(true);
  };



  const handleAddNew = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('todos');
    setFilterTipo('todos');
    setFilterGerador('todos');
    clearFilters();
  };

  const exportConsumidores = async () => {
    try {
      // Tentar exportação via API primeiro
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (filterStatus !== 'todos') queryParams.append('status', filterStatus);
        if (filterTipo !== 'todos') queryParams.append('consumerType', filterTipo);
        if (filterGerador !== 'todos') queryParams.append('generatorId', filterGerador);

        const endpoint = `/consumers/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(endpoint);

        // Criar e baixar arquivo CSV
        const csvContent = response.csvContent || '';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `consumidores-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.showSuccess('Consumidores exportados com sucesso!');
        return;
      } catch (apiError) {
        // Se a API falhar, fazer exportação local

      }

      // Exportação local como fallback
      const consumidoresParaExportar = filteredClientes;

      // Criar CSV localmente
      const headers = ['Nome', 'CPF/CNPJ', 'Tipo', 'Consumo Mensal (kWh)', 'Status', 'Gerador Vinculado', 'Porcentagem Alocada', 'Cidade', 'Estado', 'Data de Criação'];
      const csvRows = [
        headers.join(','),
        ...consumidoresParaExportar.map(consumidor => [
          `"${consumidor.name}"`,
          `"${consumidor.cpfCnpj}"`,
          consumidor.consumerType,
          consumidor.averageMonthlyConsumption || 0,
          consumidor.status,
          consumidor.generatorId ? getGeneratorName(consumidor.generatorId, geradores) : 'N/A',
          consumidor.allocatedPercentage || 0,
          `"${consumidor.city}"`,
          `"${consumidor.state}"`,
          consumidor.createdAt
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `consumidores-local-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.showSuccess(`Consumidores exportados localmente (${consumidoresParaExportar.length} registros)`);
    } catch (error) {
      toast.showError('Erro ao exportar consumidores');
    }
  };

  const getGeneratorName = (generatorId: string, geradoresList: Generator[]) => {
    if (!generatorId || !geradoresList) return 'N/A';
    const gerador = geradoresList.find(g => g.id === generatorId);
    return gerador ? gerador.ownerName : 'ID não encontrado';
  };

  const renderGeneratorIcon = (sourceType: string, className: string) => {
    const normalizedType = (sourceType || '').toUpperCase().trim();
    switch (normalizedType) {
      case 'SOLAR':
        return <Sun className={className} />;
      case 'WIND':
        return <Wind className={className} />;
      case 'HYDRO':
      case 'HIDRO':
        return <Droplet className={className} />;
      case 'BIOMASS':
      case 'BIOMASSA':
        return <Leaf className={className} />;
      default:
        return <Factory className={className} />;
    }
  };



  // Estatísticas por gerador
  const getGeneratorStats = () => {
    const stats = geradores.map(gerador => {
      const consumidoresAlocados = clientesConsumidores.filter(c => c.generatorId === gerador.id);
      const totalAlocado = consumidoresAlocados.reduce((acc, c) => acc + (c.allocatedPercentage || 0), 0);
      const consumoTotal = consumidoresAlocados.reduce((acc, c) => acc + c.averageMonthlyConsumption, 0);

      return {
        ...gerador,
        consumidoresCount: consumidoresAlocados.length,
        percentualAlocado: totalAlocado,
        consumoTotal,
        capacidadeDisponivel: 100 - totalAlocado
      };
    });

    return stats.sort((a, b) => b.consumidoresCount - a.consumidoresCount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-slate-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header com gradiente da Pagluz */}
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm mb-8">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-accent-secondary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900">Clientes Consumidores</h1>
                <p className="text-slate-500 font-medium text-sm">Gestão inteligente de consumidores de energia solar</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-xl flex items-center gap-x-2 font-semibold hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200 shadow-md text-sm sm:text-base">
              <Plus className="h-5 w-5" />Novo Consumidor
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display mb-2">Total de Clientes</p>
                <p className="text-3xl font-bold text-slate-900 font-display">{stats.total}</p>
              </div>
              <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display mb-2">Clientes Alocados</p>
                <p className="text-3xl font-bold text-accent font-display">{stats.alocados}</p>
              </div>
              <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Link className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display mb-2">Disponíveis</p>
                <p className="text-3xl font-bold text-emerald-600 font-display">{stats.disponiveis}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display mb-2">Consumo Total</p>
                <p className="text-3xl font-bold text-orange-600 font-display">{stats.consumoTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">kW/h por mês</p>
              </div>
              <div className="h-12 w-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas por Gerador */}
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-semibold font-display text-slate-900 mb-6 flex items-center">
            <Factory className="h-5 w-5 mr-3 text-accent" />
            Estatísticas por Gerador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getGeneratorStats().map((gerador) => {
              const iconColor = 'text-orange-500';

              return (
                <div key={gerador.id} className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 hover:border-accent/30 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                        {renderGeneratorIcon(gerador.sourceType, `h-5 w-5 ${iconColor}`)}
                      </div>
                      <h4 className="font-semibold text-slate-900 truncate font-display">{gerador.ownerName}</h4>
                    </div>
                    <button
                      onClick={() => setFilterGerador(gerador.id)}
                      className="text-xs bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-accent hover:text-accent transition-colors font-medium shadow-sm"
                    >
                      Filtrar
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Consumidores</span>
                      <span className="font-semibold text-slate-900">{gerador.consumidoresCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Capacidade</span>
                      <span className="font-semibold text-slate-900">{gerador.installedPower} kW</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Alocação</span>
                        <span className="font-semibold text-accent">{isNaN(gerador.percentualAlocado) ? '0.0' : gerador.percentualAlocado.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-accent h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(gerador.percentualAlocado, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros e Busca aprimorados */}
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ, cidade ou nome do gerador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all duration-200 bg-slate-50/50 focus:bg-white text-base outline-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white min-w-[140px] outline-none transition-all"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="AVAILABLE">Disponível</option>
                  <option value="ALLOCATED">Alocado</option>
                </select>
              </div>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white min-w-[140px] outline-none transition-all"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="RESIDENTIAL">Residencial</option>
                <option value="COMMERCIAL">Comercial</option>
                <option value="RURAL">Rural</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="PUBLIC_POWER">Poder Público</option>
              </select>

              {/* Novo filtro por gerador */}
              <select
                value={filterGerador}
                onChange={(e) => setFilterGerador(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white min-w-[160px] outline-none transition-all"
              >
                <option value="todos">Todos os Geradores</option>
                {geradores.map(gerador => (
                  <option key={gerador.id} value={gerador.id}>
                    {gerador.ownerName}
                  </option>
                ))}
              </select>

              {filterGerador !== 'todos' && (
                <button
                  onClick={() => setFilterGerador('todos')}
                  className="px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Limpar filtro de gerador"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={exportConsumidores}
                  className="bg-white border border-slate-200 hover:border-accent text-slate-600 hover:text-accent px-4 py-3 rounded-xl transition-all duration-200 flex items-center shadow-sm"
                  title="Exportar CSV"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  onClick={handleClearFilters}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl transition-all duration-200 flex items-center shadow-sm"
                  title="Limpar filtros"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Lista de Consumidores Responsiva */}
        <div className="space-y-6">
          <ConsumerList
            consumers={currentItems}
            generators={geradores}
            representatives={representantes}
            onEdit={handleEdit}
            onApprove={handleApproveConsumer}
            onViewInvoice={(consumer) => setInvoiceModal({ isOpen: true, consumer })}
            onGenerateCommission={handleGenerateCommissionForConsumer}
            hasCommission={hasCommission}
          />

          {/* Pagination Controls */}
          {filteredClientes.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="text-sm text-slate-500">
                Mostrando <span className="font-medium text-slate-900">{Math.min(startIndex + 1, filteredClientes.length)}</span> até <span className="font-medium text-slate-900">{Math.min(endIndex, filteredClientes.length)}</span> de <span className="font-medium text-slate-900">{filteredClientes.length}</span> resultados
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-slate-700 px-2">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {
          filteredClientes.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2 font-display">Nenhum cliente encontrado</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                {searchTerm || filterStatus !== 'todos' || filterTipo !== 'todos' || filterGerador !== 'todos'
                  ? 'Tente ajustar os filtros de busca para encontrar os clientes desejados.'
                  : 'Comece adicionando um novo cliente consumidor ao sistema.'}
              </p>
              {!searchTerm && filterStatus === 'todos' && filterTipo === 'todos' && filterGerador === 'todos' && (
                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Cliente
                </button>
              )}
            </div>
          )
        }



      </div>

      {/* Modal de Fatura */}
      < InvoiceModal
        isOpen={invoiceModal.isOpen}
        onClose={() => setInvoiceModal({ isOpen: false, consumer: null })}
        consumerId={invoiceModal.consumer?.id}
        invoiceUrl={invoiceModal.consumer?.invoiceUrl}
        invoiceFileName={invoiceModal.consumer?.invoiceFileName}
        invoiceUploadedAt={invoiceModal.consumer?.invoiceUploadedAt}
        invoiceScannedData={invoiceModal.consumer?.invoiceScannedData}
        consumerName={invoiceModal.consumer?.name}
      />

      {/* Modal aprimorado */}
      {
        showModal && (
          <ConsumidorModal
            cliente={editingClient}
            onClose={() => setShowModal(false)}
            onSave={async (data, action) => {
              try {
                let successMessage = '';

                if (action === 'create') {
                  const newClient = await createCliente(data.formData);
                  if (newClient && newClient.id && data.formData.generatorId) {
                    await allocateToGenerator(newClient.id, data.formData.generatorId, data.formData.allocatedPercentage);
                    successMessage = 'Cliente cadastrado e alocado com sucesso!';
                  } else {
                    successMessage = 'Cliente cadastrado com sucesso!';
                  }
                } else if (action === 'update') {
                  // Remover propriedades internas antes de enviar para a API
                  const { _generateCommissions, ...dataForApi } = data;

                  await updateCliente(dataForApi);

                  // Se um representante foi anexado, informar sobre geração de comissões
                  if (_generateCommissions) {
                    // Por enquanto, apenas informar que o representante foi anexado
                    // O usuário pode gerar comissões manualmente na seção de Gestão de Comissões
                    successMessage = 'Cliente atualizado com sucesso! Representante anexado. Para gerar comissões, acesse a seção "Gestão de Comissões" e clique no botão azul "Gerar Comissões".';
                  } else {
                    successMessage = 'Cliente atualizado com sucesso!';
                  }
                } else if (action === 'reallocate') {
                  await deallocateFromGenerator(data.id);
                  await allocateToGenerator(data.id, data.generatorId, data.allocatedPercentage);
                  successMessage = 'Cliente realocado com sucesso!';
                } else if (action === 'allocate') {
                  await allocateToGenerator(data.id, data.generatorId, data.allocatedPercentage);
                  successMessage = 'Cliente alocado com sucesso!';
                } else if (action === 'deallocate') {
                  await deallocateFromGenerator(data.id);
                  await updateCliente({ id: data.id, ...data.formData });
                  successMessage = 'Cliente desalocado e atualizado com sucesso!';
                }

                toast.showSuccess(successMessage);
                setShowModal(false);
                setEditingClient(null);

              } catch (error) {
                toast.showError('Erro ao salvar cliente consumidor.');
              }
            }}
          />
        )
      }
    </div >
  );
}

// Modal Component aprimorado (mantém a mesma estrutura, mas com design atualizado)
function ConsumidorModal({
  cliente,
  onClose,
  onSave
}: {
  cliente: Consumer | null;
  onClose: () => void;
  onSave: (data: any, action: 'create' | 'update' | 'allocate' | 'deallocate' | 'reallocate') => void;
}) {
  const { clientes: geradores, loading: loadingGeradores, error } = useClientesGeradores();
  const { clientes: todosConsumidores } = useClientesConsumidores();
  const { representantes, loading: loadingRepresentantes } = useRepresentantesComerciais();
  const toast = useToast();

  // Helper function to convert ISO date to yyyy-MM-dd format
  const formatDateForInput = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    name: cliente?.name || '',
    documentType: cliente?.documentType || DocumentType.CPF,
    cpfCnpj: cliente?.cpfCnpj || '',
    phone: cliente?.phone || '',
    email: cliente?.email || '',
    street: cliente?.street || '',
    number: cliente?.number || '',
    neighborhood: cliente?.neighborhood || '',
    zipCode: cliente?.zipCode || '',
    ucNumber: cliente?.ucNumber || '',
    concessionaire: cliente?.concessionaire || '',
    city: cliente?.city || '',
    state: cliente?.state || '',
    consumerType: cliente?.consumerType || 'RESIDENTIAL',
    phase: cliente?.phase || 'SINGLE',
    averageMonthlyConsumption: cliente?.averageMonthlyConsumption || 0,
    discountOffered: cliente?.discountOffered || 0,
    status: cliente?.status || ConsumerStatus.AVAILABLE,
    generatorId: cliente?.generatorId || '',
    allocatedPercentage: cliente?.allocatedPercentage || 0,
    representativeId: cliente?.representativeId || '',
    // Campos opcionais
    representativeName: cliente?.representativeName || '',
    representativeRg: cliente?.representativeRg || '',
    receiveWhatsapp: cliente?.receiveWhatsapp || false,
    complement: cliente?.complement || '',
    birthDate: formatDateForInput(cliente?.birthDate),
    observations: cliente?.observations || '',
    arrivalDate: formatDateForInput(cliente?.arrivalDate)
  });

  // Estados para controle de erros visuais
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Update form data when client changes
  useEffect(() => {
    if (cliente) {
      setFormData({
        name: cliente.name || '',
        documentType: cliente.documentType || DocumentType.CPF,
        cpfCnpj: cliente.cpfCnpj || '',
        phone: cliente.phone || '',
        email: cliente.email || '',
        street: cliente.street || '',
        number: cliente.number || '',
        neighborhood: cliente.neighborhood || '',
        zipCode: cliente.zipCode || '',
        ucNumber: cliente.ucNumber || '',
        concessionaire: cliente.concessionaire || '',
        city: cliente.city || '',
        state: cliente.state || '',
        consumerType: cliente.consumerType || 'RESIDENTIAL',
        phase: cliente.phase || 'SINGLE',
        averageMonthlyConsumption: cliente.averageMonthlyConsumption || 0,
        discountOffered: cliente.discountOffered || 0,
        status: cliente.status || ConsumerStatus.AVAILABLE,
        generatorId: cliente.generatorId || '',
        allocatedPercentage: cliente.allocatedPercentage || 0,
        representativeId: cliente.representativeId || '',
        // Campos opcionais
        representativeName: cliente.representativeName || '',
        representativeRg: cliente.representativeRg || '',
        receiveWhatsapp: cliente.receiveWhatsapp || false,
        complement: cliente.complement || '',
        birthDate: formatDateForInput(cliente.birthDate),
        observations: cliente.observations || '',
        arrivalDate: formatDateForInput(cliente.arrivalDate)
      });
    } else {
      // Reset form for new client
      setFormData({
        name: '',
        documentType: DocumentType.CPF,
        cpfCnpj: '',
        phone: '',
        email: '',
        street: '',
        number: '',
        neighborhood: '',
        zipCode: '',
        ucNumber: '',
        concessionaire: '',
        city: '',
        state: '',
        consumerType: 'RESIDENTIAL',
        phase: 'SINGLE',
        averageMonthlyConsumption: 0,
        discountOffered: 0,
        status: ConsumerStatus.AVAILABLE,
        generatorId: '',
        allocatedPercentage: 0,
        representativeId: '',
        representativeName: '',
        representativeRg: '',
        receiveWhatsapp: false,
        complement: '',
        birthDate: '',
        observations: '',
        arrivalDate: ''
      });
    }
  }, [cliente]);

  useEffect(() => {
    if (formData.generatorId && formData.averageMonthlyConsumption > 0) {
      const selectedGenerator = geradores.find(g => g.id === formData.generatorId);
      if (selectedGenerator && selectedGenerator.installedPower > 0) {
        const percentage = (formData.averageMonthlyConsumption / selectedGenerator.installedPower) * 100;
        const roundedPercentage = Math.round(percentage * 100) / 100;
        setFormData(prev => ({ ...prev, allocatedPercentage: roundedPercentage }));
      }
    }
  }, [formData.generatorId, formData.averageMonthlyConsumption, geradores]);

  const handleStatusChange = (newStatus: string) => {
    const updatedFormData = { ...formData, status: newStatus };
    if (newStatus === ConsumerStatus.AVAILABLE) {
      updatedFormData.generatorId = '';
      updatedFormData.allocatedPercentage = 0;
    }
    setFormData(updatedFormData as any);
  };

  // Funções para aplicar máscaras
  const handlePhoneChange = (value: string) => {
    const maskedValue = applyPhoneMask(value);
    setFormData({ ...formData, phone: maskedValue });
  };

  const handleCepChange = (value: string) => {
    const maskedValue = applyCepMask(value);
    setFormData({ ...formData, zipCode: maskedValue });
  };

  const handleDocumentChange = (value: string) => {
    const maskedValue = applyDocumentMask(value, formData.documentType);
    setFormData({ ...formData, cpfCnpj: maskedValue });
  };

  const handleRgChange = (value: string) => {
    const maskedValue = value.replace(/[^0-9A-Za-z]/g, '');
    setFormData({ ...formData, representativeRg: maskedValue });
  };

  // Função para limpar erro de um campo específico
  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: false
    }));
  };

  // Funções de validação
  const validateForm = () => {
    const errors: string[] = [];
    const newFieldErrors: Record<string, boolean> = {};

    // Required field validations
    if (!formData.name.trim()) {
      errors.push('Nome é obrigatório');
      newFieldErrors.name = true;
    }
    if (!formData.cpfCnpj.trim()) {
      errors.push('CPF/CNPJ é obrigatório');
      newFieldErrors.cpfCnpj = true;
    }
    if (!formData.phone.trim()) {
      errors.push('Telefone é obrigatório');
      newFieldErrors.phone = true;
    }
    if (!formData.email.trim()) {
      errors.push('E-mail é obrigatório');
      newFieldErrors.email = true;
    }
    if (!formData.street.trim()) {
      errors.push('Rua é obrigatória');
      newFieldErrors.street = true;
    }
    if (!formData.number.trim()) {
      errors.push('Número é obrigatório');
      newFieldErrors.number = true;
    }
    if (!formData.neighborhood.trim()) {
      errors.push('Bairro é obrigatório');
      newFieldErrors.neighborhood = true;
    }
    if (!formData.zipCode.trim()) {
      errors.push('CEP é obrigatório');
      newFieldErrors.zipCode = true;
    }
    if (!formData.ucNumber.trim()) {
      errors.push('Número da UC é obrigatório');
      newFieldErrors.ucNumber = true;
    }
    if (!formData.concessionaire.trim()) {
      errors.push('Concessionária é obrigatória');
      newFieldErrors.concessionaire = true;
    }
    if (!formData.city.trim()) {
      errors.push('Cidade é obrigatória');
      newFieldErrors.city = true;
    }
    if (!formData.state.trim()) {
      errors.push('Estado é obrigatório');
      newFieldErrors.state = true;
    }

    // Format validations
    if (formData.email && !isValidEmail(formData.email)) {
      errors.push('E-mail inválido');
      newFieldErrors.email = true;
    }
    if (formData.phone && !isValidPhone(formData.phone)) {
      errors.push('Telefone inválido');
      newFieldErrors.phone = true;
    }
    if (formData.zipCode && !isValidCep(formData.zipCode)) {
      errors.push('CEP inválido');
      newFieldErrors.zipCode = true;
    }
    if (formData.cpfCnpj && formData.documentType === DocumentType.CPF && !isValidCpf(formData.cpfCnpj)) {
      errors.push('CPF inválido');
      newFieldErrors.cpfCnpj = true;
    }
    if (formData.cpfCnpj && formData.documentType === DocumentType.CNPJ && !isValidCnpj(formData.cpfCnpj)) {
      errors.push('CNPJ inválido');
      newFieldErrors.cpfCnpj = true;
    }

    // Numeric validations
    if (formData.averageMonthlyConsumption <= 0) {
      errors.push('Consumo mensal deve ser maior que zero');
      newFieldErrors.averageMonthlyConsumption = true;
    }
    if (formData.discountOffered < 0 || formData.discountOffered > 100) {
      errors.push('Desconto deve estar entre 0% e 100%');
      newFieldErrors.discountOffered = true;
    }

    // Atualizar estados de erro
    setFieldErrors(newFieldErrors);

    return errors;
  };

  const calcularCapacidadeDisponivel = (geradorId: string) => {
    let totalAlocado = 0;
    todosConsumidores.forEach(consumidor => {
      if (consumidor.status === ConsumerStatus.ALLOCATED &&
        consumidor.generatorId === geradorId &&
        consumidor.id !== cliente?.id) {
        totalAlocado += consumidor.allocatedPercentage || 0;
      }
    });
    return 100 - totalAlocado;
  };

  const handleSubmit = () => {
    // Validar formulário
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast.showError(`Erro de validação: ${validationErrors.join(', ')}`);
      return;
    }

    const phaseMapping = {
      SINGLE: 'MONOPHASIC',
      TWO: 'BIPHASIC',
      THREE: 'TRIPHASIC'
    };

    const dataToSend = {
      ...formData,
      phase: phaseMapping[formData.phase as keyof typeof phaseMapping] || formData.phase,
      generatorId: formData.status === ConsumerStatus.ALLOCATED && formData.generatorId ? formData.generatorId : null,
      allocatedPercentage: formData.status === ConsumerStatus.ALLOCATED ? formData.allocatedPercentage : null,
      representativeId: formData.representativeId || null,
      // Converter datas para ISO 8601
      birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : null,
      arrivalDate: formData.arrivalDate ? new Date(formData.arrivalDate).toISOString() : null
    };

    if (cliente) {
      const originalStatus = cliente.status;
      const newStatus = formData.status;
      const originalGeneratorId = cliente.generatorId;
      const newGeneratorId = formData.generatorId;
      const originalRepresentativeId = cliente.representativeId;
      const newRepresentativeId = formData.representativeId;

      // Verificar se um representante foi anexado a um consumidor existente
      const representativeWasAdded = !originalRepresentativeId && newRepresentativeId;
      const representativeWasChanged = originalRepresentativeId && newRepresentativeId && originalRepresentativeId !== newRepresentativeId;

      if (newStatus === ConsumerStatus.ALLOCATED && originalStatus === ConsumerStatus.ALLOCATED && newGeneratorId && newGeneratorId !== originalGeneratorId) {
        onSave({ id: cliente.id, generatorId: newGeneratorId, allocatedPercentage: formData.allocatedPercentage }, 'reallocate');
      } else if (newStatus === ConsumerStatus.ALLOCATED && originalStatus === ConsumerStatus.AVAILABLE && newGeneratorId) {
        onSave({ id: cliente.id, generatorId: newGeneratorId, allocatedPercentage: formData.allocatedPercentage }, 'allocate');
      } else if (newStatus === ConsumerStatus.AVAILABLE && originalStatus === ConsumerStatus.ALLOCATED) {
        onSave({ id: cliente.id, formData: dataToSend }, 'deallocate');
      } else if (representativeWasAdded || representativeWasChanged) {
        onSave({ id: cliente.id, ...dataToSend, _generateCommissions: true }, 'update');
      } else {
        onSave({ id: cliente.id, ...dataToSend }, 'update');
      }
    } else {
      onSave({ formData: dataToSend }, 'create');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={cliente ? 'Editar Cliente Consumidor' : 'Novo Cliente Consumidor'}
      description={cliente ? 'Atualize as informações do cliente abaixo. Campos obrigatórios marcados com *' : 'Preencha os dados para cadastrar um novo cliente consumidor.'}
      size="xl"
      headerVariant="brand"
    >
      <div className="space-y-6 py-2">
        {/* Informações Básicas */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Informações Básicas</h3>
              <p className="text-xs text-slate-500">Dados pessoais e de contato</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label="Nome do Cliente *"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearFieldError('name');
                }}
                error={fieldErrors.name ? 'Nome é obrigatório' : undefined}
                placeholder="Digite o nome completo"
                icon={<Users className="h-4 w-4" />}
              />
            </div>

            <Select
              label="Tipo do Documento *"
              value={formData.documentType}
              onChange={(e) => {
                setFormData({ ...formData, documentType: e.target.value as DocumentType, cpfCnpj: '' });
              }}
            >
              <option value={DocumentType.CPF}>CPF</option>
              <option value={DocumentType.CNPJ}>CNPJ</option>
            </Select>

            <Input
              label={`${formData.documentType === DocumentType.CPF ? 'CPF' : 'CNPJ'} *`}
              value={formData.cpfCnpj}
              onChange={(e) => {
                handleDocumentChange(e.target.value);
                clearFieldError('cpfCnpj');
              }}
              error={fieldErrors.cpfCnpj ? (formData.documentType === DocumentType.CPF ? 'CPF inválido' : 'CNPJ inválido') : undefined}
              placeholder={formData.documentType === DocumentType.CPF ? "000.000.000-00" : "00.000.000/0000-00"}
              icon={<FileText className="h-4 w-4" />}
            />

            <Input
              label="Telefone *"
              value={formData.phone}
              onChange={(e) => {
                handlePhoneChange(e.target.value);
                clearFieldError('phone');
              }}
              error={fieldErrors.phone ? 'Telefone inválido' : undefined}
              placeholder="(48) 99999-9999"
              type="tel"
              icon={<Phone className="h-4 w-4" />}
            />

            <Input
              label="E-mail *"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                clearFieldError('email');
              }}
              error={fieldErrors.email ? 'E-mail inválido' : undefined}
              placeholder="joao@email.com"
              type="email"
              icon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Data de Nascimento"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />

            <Input
              label="número da UC *"
              value={formData.ucNumber}
              onChange={(e) => {
                setFormData({ ...formData, ucNumber: e.target.value });
                clearFieldError('ucNumber');
              }}
              error={fieldErrors.ucNumber ? 'Número da UC é obrigatório' : undefined}
              placeholder="Número da unidade consumidora"
              icon={<Activity className="h-4 w-4" />}
            />

            <Select
              label="Concessionária *"
              value={formData.concessionaire}
              onChange={(e) => {
                setFormData({ ...formData, concessionaire: e.target.value });
                clearFieldError('concessionaire');
              }}
              error={fieldErrors.concessionaire ? 'Concessionária é obrigatória' : undefined}
            >
              <option value="">Selecione uma concessionária</option>
              <optgroup label="Região Sul">
                <option value="CELESC">CELESC - Santa Catarina</option>
                <option value="COPEL">COPEL - Paraná</option>
                <option value="CEEE">CEEE - Rio Grande do Sul</option>
                <option value="RGE">RGE - Rio Grande do Sul</option>
              </optgroup>
            </Select>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Endereço</h3>
              <p className="text-xs text-slate-500">Localização da unidade consumidora</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Input
                label="Rua *"
                value={formData.street}
                onChange={(e) => {
                  setFormData({ ...formData, street: e.target.value });
                  clearFieldError('street');
                }}
                error={fieldErrors.street ? 'Rua é obrigatória' : undefined}
                placeholder="Rua das Flores"
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>

            <Input
              label="Número *"
              value={formData.number}
              onChange={(e) => {
                setFormData({ ...formData, number: e.target.value });
                clearFieldError('number');
              }}
              error={fieldErrors.number ? 'Número é obrigatório' : undefined}
              placeholder="123"
            />

            <Input
              label="Complemento"
              value={formData.complement}
              onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
              placeholder="Apto 101"
            />

            <Input
              label="Bairro *"
              value={formData.neighborhood}
              onChange={(e) => {
                setFormData({ ...formData, neighborhood: e.target.value });
                clearFieldError('neighborhood');
              }}
              error={fieldErrors.neighborhood ? 'Bairro é obrigatório' : undefined}
              placeholder="Centro"
            />

            <Input
              label="CEP *"
              value={formData.zipCode}
              onChange={(e) => {
                handleCepChange(e.target.value);
                clearFieldError('zipCode');
              }}
              error={fieldErrors.zipCode ? 'CEP inválido' : undefined}
              placeholder="88010-000"
            />

            <Input
              label="Cidade *"
              value={formData.city}
              onChange={(e) => {
                setFormData({ ...formData, city: e.target.value });
                clearFieldError('city');
              }}
              error={fieldErrors.city ? 'Cidade é obrigatória' : undefined}
              placeholder="Nome da cidade"
            />

            <Input
              label="Estado (UF) *"
              value={formData.state}
              onChange={(e) => {
                setFormData({ ...formData, state: e.target.value.toUpperCase() });
                clearFieldError('state');
              }}
              maxLength={2}
              error={fieldErrors.state ? 'Estado é obrigatório' : undefined}
              placeholder="SC"
            />
          </div>
        </div>

        {/* Características Técnicas */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Características Técnicas</h3>
              <p className="text-xs text-slate-500">Dados técnicos de energia</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Tipo de Consumidor"
              value={formData.consumerType}
              onChange={(e) => setFormData({ ...formData, consumerType: e.target.value as any })}
            >
              <option value="RESIDENTIAL">🏠 Residencial</option>
              <option value="COMMERCIAL">🏢 Comercial</option>
              <option value="RURAL">🌾 Rural</option>
              <option value="INDUSTRIAL">🏭 Industrial</option>
              <option value="PUBLIC_POWER">🏛️ Poder Público</option>
            </Select>

            <Select
              label="Fase"
              value={formData.phase}
              onChange={(e) => setFormData({ ...formData, phase: e.target.value as any })}
            >
              <option value="SINGLE">Monofásico</option>
              <option value="TWO">Bifásico</option>
              <option value="THREE">Trifásico</option>
            </Select>

            <Input
              label="Consumo Médio Mensal (kW/h)"
              type="number"
              value={formData.averageMonthlyConsumption}
              onChange={(e) => setFormData({ ...formData, averageMonthlyConsumption: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              icon={<Activity className="h-4 w-4" />}
            />

            <Input
              label="Desconto Oferecido (%)"
              type="number"
              min={0}
              max={100}
              value={formData.discountOffered}
              onChange={(e) => setFormData({ ...formData, discountOffered: parseInt(e.target.value) || 0 })}
              placeholder="0"
              icon={<TrendingDown className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Informações do Representante */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Informações do Representante</h3>
              <p className="text-xs text-slate-500">Dados opcionais do representante</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Nome do Representante"
              value={formData.representativeName}
              onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
              placeholder="Maria Representante"
            />

            <Input
              label="RG do Representante"
              value={formData.representativeRg}
              onChange={(e) => handleRgChange(e.target.value)}
              placeholder="12.345.678-9"
            />

            <Input
              label="Data de Chegada"
              type="date"
              value={formData.arrivalDate}
              onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
            />

            <div className="flex items-center h-12 pt-6">
              <label className="flex items-center cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.receiveWhatsapp}
                    onChange={(e) => setFormData({ ...formData, receiveWhatsapp: e.target.checked })}
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </div>
                <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-slate-900">Receber WhatsApp</span>
              </label>
            </div>
          </div>
        </div>

        {/* Fatura */}
        {cliente && (cliente.invoiceUrl && cliente.invoiceUrl.trim() !== '') && (
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Fatura Anexada</h3>
                <p className="text-xs text-slate-500">Documento de fatura do cliente</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <InvoiceView
                consumerId={cliente.id}
                invoiceUrl={cliente.invoiceUrl}
                invoiceFileName={cliente.invoiceFileName}
                invoiceUploadedAt={cliente.invoiceUploadedAt}
                invoiceScannedData={cliente.invoiceScannedData}
              />
            </div>
          </div>
        )}

        {/* Observações */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Observações</h3>
              <p className="text-xs text-slate-500">Anotações internas sobre o cliente</p>
            </div>
          </div>
          <textarea
            value={formData.observations}
            onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all duration-200 bg-white text-slate-900 placeholder:text-slate-400 resize-none outline-none"
            placeholder="Cliente preferencial, observações especiais..."
          />
        </div>

        {/* Status e Alocação */}
        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-accent shadow-sm">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Status e Alocação</h3>
              <p className="text-xs text-slate-500">Gestão de vínculo e status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="AVAILABLE">✅ Disponível</option>
              <option value="ALLOCATED">🔗 Alocado</option>
            </Select>

            <div className="space-y-1">
              <Select
                label="Representante Comercial"
                value={formData.representativeId}
                onChange={(e) => setFormData({ ...formData, representativeId: e.target.value })}
              >
                <option value="">Sem representante</option>
                {loadingRepresentantes ? (
                  <option value="" disabled>Carregando representantes...</option>
                ) : (
                  representantes
                    .filter(rep => rep.status === 'ACTIVE')
                    .map((representante) => (
                      <option key={representante.id} value={representante.id}>
                        {representante.name} - {representante.city}/{representante.state}
                      </option>
                    ))
                )}
              </Select>
            </div>

            {formData.status === ConsumerStatus.ALLOCATED && (
              <>
                <Select
                  label="Gerador Vinculado"
                  value={formData.generatorId}
                  onChange={(e) => setFormData({ ...formData, generatorId: e.target.value })}
                  disabled={loadingGeradores || geradores.length === 0}
                  error={error ? 'Erro ao carregar geradores' : undefined}
                >
                  {loadingGeradores && <option value="">Carregando geradores...</option>}
                  {!loadingGeradores && geradores.length === 0 && <option value="">Nenhum gerador encontrado</option>}
                  {!loadingGeradores && geradores.length > 0 && (
                    <>
                      <option value="">Selecione um gerador</option>
                      {geradores.map((gerador) => {
                        const capacidadeDisponivel = calcularCapacidadeDisponivel(gerador.id);
                        return (
                          <option key={gerador.id} value={gerador.id}>
                            {gerador.ownerName} - {gerador.city || gerador.state} ({gerador.installedPower} kW) - {isNaN(capacidadeDisponivel) ? '0.0' : capacidadeDisponivel.toFixed(1)}% disponível
                          </option>
                        );
                      })}
                    </>
                  )}
                </Select>

                <div className="md:col-span-2">
                  <Input
                    label="% da Energia Alocada"
                    type="number"
                    value={formData.allocatedPercentage}
                    readOnly
                    disabled
                    className="bg-slate-100 cursor-not-allowed"
                    icon={<Activity className="h-4 w-4" />}
                  />

                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      <span className="font-medium">Cálculo automático:</span> (Consumo ÷ Capacidade do Gerador) × 100
                    </p>
                    {formData.allocatedPercentage > 100 && (
                      <p className="text-xs text-red-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>Atenção: O consumo excede a capacidade do gerador!</span>
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} className="rounded-full">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} showArrow className="rounded-full">
          {cliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}



