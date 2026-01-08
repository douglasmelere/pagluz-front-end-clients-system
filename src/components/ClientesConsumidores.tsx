import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Users,
  MapPin,
  Activity,
  Edit,
  Trash2,
  TrendingDown,
  Link,
  Building,
  BarChart3,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  X,
  Loader,
  Factory,
  Wind,
  Droplet,
  Leaf,
  Sun,
  Eye,
  UserCheck,
  Download,
  Phone,
  Mail,
  Home,
  MessageSquare,
  RefreshCw,
  FileText
} from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
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

export default function ClientesConsumidores() {
  const toast = useToast();
  const {
    clientes: clientesConsumidores,
    loading,
    createCliente,
    updateCliente,
    deleteCliente,
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
  const [showGeneratorDetails, setShowGeneratorDetails] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<{ isOpen: boolean; consumer: Consumer | null }>({
    isOpen: false,
    consumer: null
  });
  

  // Removido useEffect que causava loop infinito

  const filteredClientes = clientesConsumidores || [];

  // Função helper para verificar se há fatura válida
  const hasValidInvoice = (consumer: Consumer): boolean => {
    return !!(consumer.invoiceUrl && consumer.invoiceUrl.trim() !== '');
  };

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

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente consumidor?')) {
      try {
        await deleteCliente(id);
        toast.showSuccess('Cliente consumidor excluído com sucesso!');
      } catch (error) {
        toast.showError('Erro ao excluir cliente consumidor.');
      }
    }
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'AVAILABLE': { 
        label: 'Disponível', 
        color: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200',
        icon: <CheckCircle className="h-3 w-3" />
      },
      'ALLOCATED': { 
        label: 'Alocado', 
        color: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200',
        icon: <Link className="h-3 w-3" />
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.icon}
        <span>{config?.label || status}</span>
      </span>
    );
  };

  const getTipoIcon = (tipo: string) => {
    const icons = {
      'RESIDENTIAL': { icon: '🏠', color: 'bg-green-100 text-green-600' },
      'COMMERCIAL': { icon: '🏢', color: 'bg-blue-100 text-blue-600' }, 
      'RURAL': { icon: '🌾', color: 'bg-yellow-100 text-yellow-600' },
      'INDUSTRIAL': { icon: '🏭', color: 'bg-purple-100 text-purple-600' },
      'PUBLIC_POWER': { icon: '🏛️', color: 'bg-indigo-100 text-indigo-600' }
    };
    const config = icons[tipo as keyof typeof icons] || { icon: '🏢', color: 'bg-gray-100 text-gray-600' };
    return { icon: config.icon, color: config.color };
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

  const getGeneratorDetails = (generatorId: string) => {
    return geradores.find(g => g.id === generatorId);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header com gradiente da Pagluz */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
        <div className="w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Clientes Consumidores</h1>
                  <p className="text-slate-200 text-sm sm:text-base lg:text-lg mt-1">Gestão inteligente de consumidores de energia solar</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-xl lg:rounded-2xl flex items-center space-x-2 sm:space-x-3 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-2xl border border-white/20"
              >
                <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base lg:text-lg">Novo Consumidor</span>
              </button>
              
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Total de Clientes</p>
                <p className="text-4xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Clientes Alocados</p>
                <p className="text-4xl font-bold text-blue-600">{stats.alocados}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Link className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Disponíveis</p>
                <p className="text-4xl font-bold text-emerald-600">{stats.disponiveis}</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600 mb-2">Consumo Total</p>
                <p className="text-4xl font-bold text-orange-600">{stats.consumoTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500">kW/h por mês</p>
              </div>
              <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas por Gerador */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <Factory className="h-6 w-6 mr-3 text-green-600" />
            Estatísticas por Gerador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {getGeneratorStats().map((gerador) => {
                                          const iconColor = 'text-yellow-500';
              
              return (
                <div key={gerador.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                                              {renderGeneratorIcon(gerador.sourceType, `h-5 w-5 ${iconColor}`)}
                      <h4 className="font-semibold text-slate-900 truncate">{gerador.ownerName}</h4>
                    </div>
                    <button
                      onClick={() => setFilterGerador(gerador.id)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Filtrar
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Consumidores:</span>
                      <span className="font-semibold text-slate-900">{gerador.consumidoresCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Capacidade:</span>
                      <span className="font-semibold text-slate-900">{gerador.installedPower} kW</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Alocado:</span>
                      <span className="font-semibold text-blue-600">{isNaN(gerador.percentualAlocado) ? '0.0' : gerador.percentualAlocado.toFixed(1)}%</span>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(gerador.percentualAlocado, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filtros e Busca aprimorados */}
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CPF/CNPJ, cidade ou nome do gerador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-slate-50 focus:bg-white text-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-slate-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 min-w-[140px]"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="AVAILABLE">Disponível</option>
                  <option value="ALLOCATED">Alocado</option>
                </select>
              </div>
              <select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 min-w-[140px]"
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
                className="border border-slate-200 rounded-xl px-4 py-4 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 min-w-[160px]"
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
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Limpar filtro de gerador"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={exportConsumidores}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Download className="h-5 w-5" />
                <span>Exportar</span>
              </button>
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

        {/* Tabela redesenhada com layout mais amplo */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full" style={{ minWidth: '1200px', tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b border-slate-300">
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '200px' }}>Cliente</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '180px' }}>Contato</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '150px' }}>Tipo/Consumo</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '200px' }}>Endereço</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '180px' }}>Representante</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '200px' }}>Gerador Vinculado</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '150px' }}>Desconto/Alocação</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '120px' }}>Status</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '100px' }}>Fatura</th>
                  <th className="px-8 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider" style={{ width: '250px' }}>Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredClientes.map((cliente) => {
                  const tipoConfig = getTipoIcon(cliente.consumerType);
                  const geradorDetails = getGeneratorDetails(cliente.generatorId || '');
                  
                  return (
                    <tr key={cliente.id} className="hover:bg-slate-50 transition-all duration-200 group">
                      <td className="px-6 py-6">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${tipoConfig.color} flex items-center justify-center text-lg shadow-sm`}>
                            {tipoConfig.icon}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-bold text-slate-900 group-hover:text-green-600 transition-colors">
                              {cliente.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">{cliente.cpfCnpj}</div>
                            <div className="text-xs text-slate-400">
                              {cliente.documentType === DocumentType.CPF ? 'CPF' : 'CNPJ'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-900 flex items-center">
                            <Phone className="h-3 w-3 mr-1 text-slate-400" />
                            {cliente.phone || 'Não informado'}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center">
                            <Mail className="h-3 w-3 mr-1 text-slate-400" />
                            {cliente.email || 'Não informado'}
                          </div>
                          {cliente.receiveWhatsapp && (
                            <div className="text-xs text-green-600 flex items-center">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              WhatsApp ativo
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-900 capitalize flex items-center">
                            <Building className="h-3 w-3 mr-1 text-slate-400" />
                            {cliente.consumerType.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-slate-600 flex items-center">
                            <Activity className="h-3 w-3 mr-1 text-slate-400" />
                            <span className="font-semibold">{cliente.averageMonthlyConsumption.toLocaleString()}</span>
                            <span className="ml-1">kW/h</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-1">
                          <div className="text-xs text-slate-900 flex items-center">
                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                            {cliente.city}, {cliente.state}
                          </div>
                          <div className="text-xs text-slate-600">
                            {cliente.street && cliente.number && (
                              <span>{cliente.street}, {cliente.number}</span>
                            )}
                            {cliente.neighborhood && (
                              <span className="block">{cliente.neighborhood}</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">{cliente.ucNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {cliente.representativeId ? (
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <div className="text-xs text-slate-900 flex items-center">
                                <UserCheck className="h-3 w-3 mr-1 text-blue-600" />
                                <span className="font-medium">
                                  {representantes.find(rep => rep.id === cliente.representativeId)?.name || 'Representante não encontrado'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                {representantes.find(rep => rep.id === cliente.representativeId)?.city}, {representantes.find(rep => rep.id === cliente.representativeId)?.state}
                              </div>
                              {cliente.representativeName && (
                                <div className="text-xs text-slate-600">
                                  Nome: {cliente.representativeName}
                                </div>
                              )}
                              {cliente.arrivalDate && (
                                <div className="text-xs text-slate-500">
                                  Chegada: {new Date(cliente.arrivalDate).toLocaleDateString('pt-BR')}
                                </div>
                              )}
                            </div>
                            {hasCommission(cliente.id) ? (
                              <div className="flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle className="h-3 w-3" />
                                <span>Comissão Gerada</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleGenerateCommissionForConsumer(cliente.id)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                              >
                                <RefreshCw className="h-3 w-3" />
                                <span>Gerar Comissão</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Sem representante
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        {cliente.generatorId && geradorDetails ? (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              {renderGeneratorIcon(geradorDetails.sourceType, 'h-4 w-4 text-yellow-500')}
                              <span className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">
                                {geradorDetails.ownerName}
                              </span>
                              <button
                                onClick={() => setShowGeneratorDetails(showGeneratorDetails === cliente.id ? null : cliente.id)}
                                className="p-1 hover:bg-slate-100 rounded transition-colors"
                                title="Ver detalhes do gerador"
                              >
                                <Eye className="h-3 w-3 text-slate-400" />
                              </button>
                            </div>
                            <div className="text-xs text-slate-500">
                              {geradorDetails.city}, {geradorDetails.state}
                            </div>
                            <div className="text-xs text-slate-500">
                              {geradorDetails.installedPower} kW instalados
                            </div>
                            
                            {/* Detalhes expandidos do gerador */}
                            {showGeneratorDetails === cliente.id && (
                              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Tipo:</span>
                                    <span className="font-medium">{geradorDetails.sourceType}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Potência:</span>
                                    <span className="font-medium">{geradorDetails.installedPower} kW</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-600">Localização:</span>
                                    <span className="font-medium">{geradorDetails.city}/{geradorDetails.state}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">
                            Nenhum gerador vinculado
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
                            <span className="text-xs font-bold text-green-600">{cliente.discountOffered}%</span>
                            <span className="text-xs text-slate-500 ml-1">desconto</span>
                          </div>
                          {cliente.status === ConsumerStatus.ALLOCATED && (
                            <div className="flex items-center">
                              <div className="w-full bg-slate-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(cliente.allocatedPercentage || 0, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-600 font-semibold min-w-[40px]">
                                {cliente.allocatedPercentage ? cliente.allocatedPercentage.toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="space-y-2">
                          {getStatusBadge(cliente.status)}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        {hasValidInvoice(cliente) ? (
                          <button
                            onClick={() => setInvoiceModal({ isOpen: true, consumer: cliente })}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 border border-blue-200"
                            title="Ver fatura"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium">Ver Fatura</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sem fatura</span>
                        )}
                      </td>
                      <td className="px-8 py-6" style={{ width: '250px' }}>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(cliente)}
                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Editar cliente"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {cliente.representativeId && (
                            <button
                              onClick={() => handleApproveConsumer(cliente)}
                              className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-1"
                              title="Aprovar consumidor"
                            >
                              <CheckCircle className="h-3 w-3" />
                              <span>Aprovar</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Excluir cliente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClientes.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum cliente encontrado</h3>
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
          )}
        </div>
      </div>

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

      {/* Modal aprimorado */}
      {showModal && (
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
      )}
    </div>
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header do Modal */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-2xl font-bold">
                {cliente ? 'Editar Cliente Consumidor' : 'Novo Cliente Consumidor'}
              </h2>
              <p className="text-green-100 mt-1">
                {cliente ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente consumidor'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      clearFieldError('name');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Digite o nome completo"
                  />
                  {fieldErrors.name && (
                    <p className="text-red-500 text-sm mt-1">Nome é obrigatório</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo do Documento *
                  </label>
                  <select
                    value={formData.documentType}
                    onChange={(e) => {
                      setFormData({...formData, documentType: e.target.value as DocumentType, cpfCnpj: ''});
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value={DocumentType.CPF}>CPF</option>
                    <option value={DocumentType.CNPJ}>CNPJ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.documentType === DocumentType.CPF ? 'CPF' : 'CNPJ'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpfCnpj}
                    onChange={(e) => {
                      handleDocumentChange(e.target.value);
                      clearFieldError('cpfCnpj');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.cpfCnpj ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder={formData.documentType === DocumentType.CPF ? "000.000.000-00" : "00.000.000/0000-00"}
                  />
                  {fieldErrors.cpfCnpj && (
                    <p className="text-red-500 text-sm mt-1">
                      {formData.documentType === DocumentType.CPF ? 'CPF inválido' : 'CNPJ inválido'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      handlePhoneChange(e.target.value);
                      clearFieldError('phone');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="(48) 99999-9999"
                  />
                  {fieldErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">Telefone inválido</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({...formData, email: e.target.value});
                      clearFieldError('email');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="joao@email.com"
                  />
                  {fieldErrors.email && (
                    <p className="text-red-500 text-sm mt-1">E-mail inválido</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da UC
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ucNumber}
                    onChange={(e) => {
                      setFormData({...formData, ucNumber: e.target.value});
                      clearFieldError('ucNumber');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.ucNumber ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Número da unidade consumidora"
                  />
                  {fieldErrors.ucNumber && (
                    <p className="text-red-500 text-sm mt-1">Número da UC é obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Concessionária
                  </label>
                  <select
                    value={formData.concessionaire}
                    onChange={(e) => {
                      setFormData({...formData, concessionaire: e.target.value});
                      clearFieldError('concessionaire');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.concessionaire ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    required
                  >
                    <option value="">Selecione uma concessionária</option>
                    <optgroup label="Região Sul">
                      <option value="CELESC">CELESC - Santa Catarina</option>
                      <option value="COPEL">COPEL - Paraná</option>
                      <option value="CEEE">CEEE - Rio Grande do Sul</option>
                      <option value="RGE">RGE - Rio Grande do Sul</option>
                    </optgroup>
                    {/* Outras regiões... */}
                  </select>
                  {fieldErrors.concessionaire && (
                    <p className="text-red-500 text-sm mt-1">Concessionária é obrigatória</p>
                  )}
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2 text-green-600" />
                Endereço
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rua *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.street}
                    onChange={(e) => {
                      setFormData({...formData, street: e.target.value});
                      clearFieldError('street');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.street ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Rua das Flores"
                  />
                  {fieldErrors.street && (
                    <p className="text-red-500 text-sm mt-1">Rua é obrigatória</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.number}
                    onChange={(e) => {
                      setFormData({...formData, number: e.target.value});
                      clearFieldError('number');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.number ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="123"
                  />
                  {fieldErrors.number && (
                    <p className="text-red-500 text-sm mt-1">Número é obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.complement}
                    onChange={(e) => setFormData({...formData, complement: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Apto 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.neighborhood}
                    onChange={(e) => {
                      setFormData({...formData, neighborhood: e.target.value});
                      clearFieldError('neighborhood');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.neighborhood ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Centro"
                  />
                  {fieldErrors.neighborhood && (
                    <p className="text-red-500 text-sm mt-1">Bairro é obrigatório</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.zipCode}
                    onChange={(e) => {
                      handleCepChange(e.target.value);
                      clearFieldError('zipCode');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.zipCode ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="88010-000"
                  />
                  {fieldErrors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">CEP inválido</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({...formData, city: e.target.value});
                      clearFieldError('city');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Nome da cidade"
                  />
                  {fieldErrors.city && (
                    <p className="text-red-500 text-sm mt-1">Cidade é obrigatória</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.state}
                    onChange={(e) => {
                      setFormData({...formData, state: e.target.value.toUpperCase()});
                      clearFieldError('state');
                    }}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${
                      fieldErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="SC"
                  />
                  {fieldErrors.state && (
                    <p className="text-red-500 text-sm mt-1">Estado é obrigatório</p>
                  )}
                </div>
              </div>
            </div>

            {/* Características Técnicas */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Características Técnicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Consumidor
                  </label>
                  <select
                    value={formData.consumerType}
                    onChange={(e) => setFormData({...formData, consumerType: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="RESIDENTIAL">🏠 Residencial</option>
                    <option value="COMMERCIAL">🏢 Comercial</option>
                    <option value="RURAL">🌾 Rural</option>
                    <option value="INDUSTRIAL">🏭 Industrial</option>
                    <option value="PUBLIC_POWER">🏛️ Poder Público</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fase
                  </label>
                  <select
                    value={formData.phase}
                    onChange={(e) => setFormData({...formData, phase: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="SINGLE">Monofásico</option>
                    <option value="TWO">Bifásico</option>
                    <option value="THREE">Trifásico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Consumo Médio Mensal (kW/h)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.averageMonthlyConsumption}
                    onChange={(e) => setFormData({...formData, averageMonthlyConsumption: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Desconto Oferecido (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.discountOffered}
                    onChange={(e) => setFormData({...formData, discountOffered: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Informações do Representante (Opcional) */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <UserCheck className="h-5 w-5 mr-2 text-green-600" />
                Informações do Representante (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Representante
                  </label>
                  <input
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => setFormData({...formData, representativeName: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Maria Representante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RG do Representante
                  </label>
                  <input
                    type="text"
                    value={formData.representativeRg}
                    onChange={(e) => handleRgChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Chegada
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="receiveWhatsapp"
                    checked={formData.receiveWhatsapp}
                    onChange={(e) => setFormData({...formData, receiveWhatsapp: e.target.checked})}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="receiveWhatsapp" className="ml-2 block text-sm text-gray-700">
                    Receber WhatsApp
                  </label>
                </div>
              </div>
            </div>

            {/* Fatura (apenas visualização) */}
            {cliente && (cliente.invoiceUrl && cliente.invoiceUrl.trim() !== '') && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Fatura Anexada
                </h3>
                <InvoiceView
                  consumerId={cliente.id}
                  invoiceUrl={cliente.invoiceUrl}
                  invoiceFileName={cliente.invoiceFileName}
                  invoiceUploadedAt={cliente.invoiceUploadedAt}
                  invoiceScannedData={cliente.invoiceScannedData}
                />
              </div>
            )}

            {/* Observações */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                Observações
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Cliente preferencial, observações especiais..."
                />
              </div>
            </div>

            {/* Status e Alocação */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Status e Alocação
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="AVAILABLE">✅ Disponível</option>
                    <option value="ALLOCATED">🔗 Alocado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Representante Comercial</label>
                  <select
                                      value={formData.representativeId}
                  onChange={(e) => setFormData({ ...formData, representativeId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Sem representante</option>
                    {loadingRepresentantes && (
                      <option value="">Carregando representantes...</option>
                    )}
                    {!loadingRepresentantes && representantes.length > 0 && (
                      representantes
                        .filter(rep => rep.status === 'ACTIVE')
                        .map((representante) => (
                          <option key={representante.id} value={representante.id}>
                            {representante.name} - {representante.city}/{representante.state}
                          </option>
                        ))
                    )}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional: Vincule um representante comercial ativo
                  </p>
                </div>

                {formData.status === ConsumerStatus.ALLOCATED && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gerador Vinculado</label>
                      <select
                        value={formData.generatorId}
                        onChange={(e) => setFormData({ ...formData, generatorId: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        disabled={loadingGeradores || geradores.length === 0}
                        required
                      >
                        {loadingGeradores && (
                          <option value="">Carregando geradores...</option>
                        )}
                        {!loadingGeradores && geradores.length === 0 && (
                          <option value="">Nenhum gerador encontrado</option>
                        )}
                        {!loadingGeradores && geradores.length > 0 && (
                          <>
                            <option value="">Selecione um gerador</option>
                            {geradores.map((gerador) => {
                              const name = gerador.ownerName || gerador.ownerName;
                              const location = gerador.city || gerador.state;
                              const capacity = gerador.installedPower || gerador.installedPower;
                              const capacidadeDisponivel = calcularCapacidadeDisponivel(gerador.id);
                              
                              return (
                                <option key={gerador.id} value={gerador.id}>
                                  {name} - {location} ({capacity} kW) - {isNaN(capacidadeDisponivel) ? '0.0' : capacidadeDisponivel.toFixed(1)}% disponível
                                </option>
                              );
                            })}
                          </>
                        )}
                      </select>
                      {error && <p className="text-xs text-red-600 mt-1">Erro ao carregar geradores.</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">% da Energia Alocada</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={formData.allocatedPercentage}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-100 cursor-not-allowed transition-all duration-200"
                          readOnly
                          disabled
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                          <span className="text-gray-500 text-sm bg-green-100 px-2 py-1 rounded-lg">Automático</span>
                        </div>
                      </div>
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs text-blue-700">
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

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
              >
                <span>{cliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



