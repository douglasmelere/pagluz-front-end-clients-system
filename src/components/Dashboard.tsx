import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import ErrorMessage from './common/ErrorMessage';
import { 
  Users, 
  Factory, 
  TrendingUp, 
  Zap,
  Calendar,
  Activity,
  BarChart3,
  TrendingDown,
  CheckCircle,
  Target,
  Loader,
  Filter,
  Download
} from 'lucide-react';
import { useClientesGeradores } from '../hooks/useClientesGeradores';
import { useClientesConsumidores } from '../hooks/useClientesConsumidores';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { ConsumerStatus } from '../types';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';

export default function Dashboard() {
  const toast = useToast();
  const { dashboardData, loading, error, filters, refetch, updateFilters, clearFilters } = useDashboard();
  const { clientes: geradores } = useClientesGeradores();
  const { clientes: clientesConsumidores } = useClientesConsumidores();
  const { representantes, statistics: representantesStats } = useRepresentantesComerciais();

  const [showFilters, setShowFilters] = useState(false);

  // Funções para gerar dados de distribuição a partir dos dados locais
  const gerarDistribuicaoPorFonte = () => {
    if (!geradores || geradores.length === 0) return [];
    
    const distribuicao = geradores.reduce((acc, gerador) => {
      const sourceType = gerador.sourceType || 'NÃO_INFORMADO';
      const existing = acc.find(item => item.sourceType === sourceType);
      
      if (existing) {
        existing.count += 1;
        existing.totalPower += gerador.installedPower || 0;
      } else {
        acc.push({
          sourceType,
          count: 1,
          totalPower: gerador.installedPower || 0
        });
      }
      
      return acc;
    }, [] as Array<{sourceType: string, count: number, totalPower: number}>);
    
    return distribuicao.sort((a, b) => b.count - a.count);
  };

  const gerarDistribuicaoPorTipo = () => {
    if (!clientesConsumidores || clientesConsumidores.length === 0) return [];
    
    const distribuicao = clientesConsumidores.reduce((acc, consumidor) => {
      const consumerType = consumidor.consumerType || 'NÃO_INFORMADO';
      const existing = acc.find(item => item.consumerType === consumerType);
      
      if (existing) {
        existing.count += 1;
        existing.totalConsumption += consumidor.averageMonthlyConsumption || 0;
      } else {
        acc.push({
          consumerType,
          count: 1,
          totalConsumption: consumidor.averageMonthlyConsumption || 0
        });
      }
      
      return acc;
    }, [] as Array<{consumerType: string, count: number, totalConsumption: number}>);
    
    return distribuicao.sort((a, b) => b.count - a.count);
  };

  // Usar dados da API se disponíveis, senão usar dados locais
  const dadosFonteEnergia = dashboardData?.generatorsBySource && dashboardData.generatorsBySource.length > 0 
    ? dashboardData.generatorsBySource 
    : gerarDistribuicaoPorFonte();
    
  const dadosTipoConsumidor = dashboardData?.consumersByType && dashboardData.consumersByType.length > 0 
    ? dashboardData.consumersByType 
    : gerarDistribuicaoPorTipo();

  // Removido useEffect que causava loop infinito

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value || '' };
    updateFilters(newFilters);
  };

  const exportDashboard = async () => {
    try {
      // Tentar exportação via API primeiro
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.period && filters.period !== 'month') queryParams.append('period', filters.period);
        
        const endpoint = `/dashboard/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(endpoint);
        
        // Criar e baixar arquivo CSV
        const csvContent = response.csvContent || '';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `dashboard-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.showSuccess('Dashboard exportado com sucesso!');
        return;
      } catch (apiError) {
        // Se a API falhar, fazer exportação local

      }
      
      // Exportação local como fallback
      const dashboardData = {
        estatisticas: {
          totalGeradores: geradores.length,
          totalConsumidores: clientesConsumidores.length,
          potenciaTotal: calcularCapacidadeTotalGeradores(),
          consumoTotal: calcularConsumoTotalConsumidores(),
          capacidadeNaoAlocada: calcularCapacidadeNaoAlocada(),
          consumidoresNaoAlocados: calcularConsumidoresNaoAlocados()
        },
        geradores: geradores.map(g => ({
          nome: g.ownerName,
          tipo: g.sourceType,
          potencia: g.installedPower,
          cidade: g.city,
          estado: g.state,
          status: g.status
        })),
        consumidores: clientesConsumidores.map(c => ({
          nome: c.name,
          tipo: c.consumerType,
          consumo: c.averageMonthlyConsumption,
          status: c.status,
          geradorVinculado: c.generatorId ? geradores.find(g => g.id === c.generatorId)?.ownerName : 'N/A',
          porcentagemAlocada: c.allocatedPercentage || 0
        }))
      };
      
      // Criar CSV localmente
      const headers = ['Categoria', 'Item', 'Valor', 'Detalhes'];
      const csvRows = [
        headers.join(','),
        // Estatísticas gerais
        ['Estatísticas', 'Total de Geradores', dashboardData.estatisticas.totalGeradores, ''],
        ['Estatísticas', 'Total de Consumidores', dashboardData.estatisticas.totalConsumidores, ''],
        ['Estatísticas', 'Potência Total (kW)', dashboardData.estatisticas.potenciaTotal, ''],
        ['Estatísticas', 'Consumo Total (kWh)', dashboardData.estatisticas.consumoTotal, ''],
        ['Estatísticas', 'Capacidade Não Alocada (kW)', dashboardData.estatisticas.capacidadeNaoAlocada, ''],
        ['Estatísticas', 'Consumidores Não Alocados', dashboardData.estatisticas.consumidoresNaoAlocados.quantidade, ''],
        ['Estatísticas', 'Consumo Não Alocado (kWh)', dashboardData.estatisticas.consumidoresNaoAlocados.totalKwh, ''],
        // Geradores
        ...dashboardData.geradores.map(g => ['Geradores', g.nome, g.potencia, `${g.tipo} - ${g.cidade}, ${g.estado}`]),
        // Consumidores
        ...dashboardData.consumidores.map(c => ['Consumidores', c.nome, c.consumo, `${c.tipo} - ${c.status} - ${c.geradorVinculado}`])
      ].map(row => Array.isArray(row) ? row.join(',') : row);
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-local-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.showSuccess('Dashboard exportado localmente com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      toast.showError('Erro ao exportar dashboard');
    }
  };

  // Função para formatar números com separadores de milhares
  const formatarNumero = (numero: number) => {
    return numero.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Capacidade Total de Geradores = Soma da potência instalada de todos os geradores
  const calcularCapacidadeTotalGeradores = () => {
    return geradores.reduce((total, gerador) => {
      return total + (gerador.installedPower || 0);
    }, 0);
  };

  // Capacidade Não Alocada = Total de KWh de todas as usinas - Total alocado
  const calcularCapacidadeNaoAlocada = () => {
    // 1. Calcular capacidade total de todos os geradores
    const capacidadeTotal = calcularCapacidadeTotalGeradores();
    
    // 2. Calcular total alocado
    let totalAlocado = 0;
    clientesConsumidores.forEach(cliente => {
      if (cliente.status === ConsumerStatus.ALLOCATED && cliente.generatorId) {
        const gerador = geradores.find(g => g.id === cliente.generatorId);
        if (gerador) {
          // Total alocado = % alocada * potência instalada do gerador
          const alocacaoCliente = ((cliente.allocatedPercentage || 0) / 100) * (gerador.installedPower || 0);
          totalAlocado += alocacaoCliente;
        }
      }
    });
    
    // 3. Capacidade não alocada = Total - Alocado
    return capacidadeTotal - totalAlocado;
  };

  // Consumo Total dos Consumidores = Soma do consumo de todos os clientes consumidores
  const calcularConsumoTotalConsumidores = () => {
    // Soma total do consumo de todos os consumidores
    const consumoTotalConsumidores = clientesConsumidores.reduce((total, cliente) => {
      return total + (cliente.averageMonthlyConsumption || 0);
    }, 0);

    return consumoTotalConsumidores;
  };

  // Consumidores Não Alocados = Quantidade e total de KW/h de consumidores sem gerador
  const calcularConsumidoresNaoAlocados = () => {
    const consumidoresNaoAlocados = clientesConsumidores.filter(
      cliente => cliente.status !== ConsumerStatus.ALLOCATED
    );
    
    const quantidade = consumidoresNaoAlocados.length;
    
    const totalKwhNaoAlocado = consumidoresNaoAlocados.reduce((total, cliente) => {
      return total + (cliente.averageMonthlyConsumption || 0);
    }, 0);
    
    return {
      quantidade,
      totalKwh: totalKwhNaoAlocado
    };
  };

  const calcularMediaDesconto = () => {
    if (!clientesConsumidores || clientesConsumidores.length === 0) return 0;
    const totalDesconto = clientesConsumidores.reduce((total, cliente) => total + (cliente.discountOffered || 0), 0);
    return totalDesconto / clientesConsumidores.length;
  };

  const mediaDesconto = calcularMediaDesconto();
  const capacidadeNaoAlocada = calcularCapacidadeNaoAlocada();
  const consumoTotalConsumidores = calcularConsumoTotalConsumidores();
  const dadosConsumidoresNaoAlocados = calcularConsumidoresNaoAlocados();

  const totalCapacity = calcularCapacidadeTotalGeradores();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-green-600 mx-auto mb-6" />
          <p className="text-slate-600 text-lg">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <ErrorMessage message="Dados do dashboard não encontrados" onRetry={refetch} />
      </div>
    );
  }



  const stats = [
    {
      title: 'Clientes Geradores',
      value: dashboardData.totalGenerators || geradores.length || 0,
      icon: Factory,
      color: 'blue',
      change: '+12%',
      description: 'Total de geradores cadastrados',
      trend: 'up'
    },
    {
      title: 'Clientes Consumidores', 
      value: dashboardData.totalConsumers || clientesConsumidores.length || 0,
      icon: Users,
      color: 'green',
      change: '+8%',
      description: 'Total de consumidores cadastrados',
      trend: 'up'
    },
    {
      title: 'Potência Instalada',
      value: `${formatarNumero(dashboardData.totalInstalledPower ?? calcularCapacidadeTotalGeradores())} kW`,
      icon: Zap,
      color: 'yellow',
      change: '+15%',
      description: 'Capacidade total de geração',
      trend: 'up'
    },
    {
      title: 'Consumo Mensal',
      value: `${formatarNumero(dashboardData.totalMonthlyConsumption ?? calcularConsumoTotalConsumidores())} kW/h`,
      icon: TrendingUp,
      color: 'purple',
      change: '+25%',
      description: 'Consumo total mensal',
      trend: 'up'
    }
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header com gradiente da Pagluz */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-2xl rounded-b-3xl overflow-hidden">
        <div className="w-full px-4 md:px-6 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center space-x-3 mb-2">
                <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">Dashboard</h1>
                  <p className="text-slate-200 text-lg mt-1">Visão geral do sistema de energia solar</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Filter className="h-5 w-5" />
                <span>Filtros</span>
              </button>
              <button
                onClick={exportDashboard}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Download className="h-5 w-5" />
                <span>Exportar</span>
              </button>
              <div className="flex items-center space-x-3 text-slate-200 bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/20">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">{new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'from-blue-500 to-indigo-500',
              green: 'from-green-500 to-emerald-500', 
              yellow: 'from-yellow-500 to-orange-500',
              purple: 'from-purple-500 to-pink-500'
            };

            return (
              <div key={stat.title} className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-r ${colorClasses[stat.color as keyof typeof colorClasses]} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</h3>
                  <p className="text-lg font-semibold text-slate-700 mb-2">{stat.title}</p>
                  
                  <p className="text-sm text-slate-500">{stat.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Histórico de Ações Recentes */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <div className="flex items-center mb-6">
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg mr-4">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Histórico de Ações Recentes</h2>
              <p className="text-slate-600">Últimas atividades do sistema</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Ações dos Geradores */}
            {geradores.slice(0, 5).map((gerador) => (
              <div key={gerador.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Factory className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{gerador.ownerName}</p>
                  <p className="text-sm text-slate-600">
                    {gerador.status === 'ACTIVE' ? 'Ativo' : 
                     gerador.status === 'UNDER_ANALYSIS' ? 'Em Análise' : 
                     gerador.status === 'AWAITING_ALLOCATION' ? 'Aguardando Alocação' : 
                     gerador.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{gerador.installedPower} kW</p>
                  <p className="text-xs text-slate-500">{gerador.sourceType}</p>
                </div>
              </div>
            ))}
            
            {/* Ações dos Consumidores */}
            {clientesConsumidores.slice(0, 5).map((consumidor) => (
              <div key={consumidor.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{consumidor.name}</p>
                  <p className="text-sm text-slate-600">
                    {consumidor.status === 'ALLOCATED' ? 'Alocado' : 
                     consumidor.status === 'AVAILABLE' ? 'Disponível' : 
                     consumidor.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{consumidor.averageMonthlyConsumption} kW/h</p>
                  <p className="text-xs text-slate-500">{consumidor.consumerType}</p>
                </div>
              </div>
            ))}
            
            {geradores.length === 0 && clientesConsumidores.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Nenhuma atividade recente encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Filtros do Dashboard</h3>
              <button
                onClick={clearFilters}
                className="text-slate-600 hover:text-slate-900 transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Período
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="month">Mensal</option>
                  <option value="quarter">Trimestral</option>
                  <option value="year">Anual</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas de Representantes */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg mr-4">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Representantes Comerciais</h2>
              <p className="text-slate-600">Visão geral da equipe comercial</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {representantes?.length || 0}
              </div>
              <div className="text-sm font-medium text-blue-700">Total</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {representantes?.filter(rep => rep.status === 'ACTIVE').length || 0}
              </div>
              <div className="text-sm font-medium text-green-700">Ativos</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {representantes?.filter(rep => rep.status === 'PENDING_APPROVAL').length || 0}
              </div>
              <div className="text-sm font-medium text-yellow-700">Pendentes</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                N/A
              </div>
              <div className="text-sm font-medium text-purple-700">Taxa Média</div>
            </div>
          </div>
          
          {/* Representantes por Estado */}
          {representantes && representantes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Estado</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from(new Set(representantes.map(rep => rep.state))).slice(0, 8).map(state => {
                  const count = representantes.filter(rep => rep.state === state).length;
                  return (
                    <div key={state} className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-lg font-bold text-slate-700">{count}</div>
                      <div className="text-xs text-slate-500">{state}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Distribuição por Fonte de Energia */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <Zap className="h-6 w-6 mr-3 text-green-600" />
                Distribuição por Fonte de Energia
              </h2>
            </div>
            <div className="space-y-4">
              {dadosFonteEnergia && dadosFonteEnergia.length > 0 ? (
                dadosFonteEnergia.map((source) => {
                  const totalGeradores = dashboardData?.totalGenerators || geradores.length;
                  const percentage = totalGeradores > 0 ? ((source.count / totalGeradores) * 100).toFixed(0) : '0';
                  
                  return (
                    <div key={source.sourceType} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-slate-900">{source.sourceType}</span>
                        <span className="text-lg font-bold text-slate-900">{percentage}%</span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600 mb-3">
                        <span className="flex items-center">
                          <Factory className="h-4 w-4 mr-2 text-blue-600" />
                          {source.count} geradores
                        </span>
                        <span className="flex items-center">
                          <Zap className="h-4 w-4 mr-2 text-green-600" />
                          {source.totalPower} kW
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-center py-8 text-lg">
                  Nenhum dado de distribuição disponível
                </p>
              )}
            </div>
          </div>

          {/* Distribuição por Tipo de Consumidor */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                <Users className="h-6 w-6 mr-3 text-green-600" />
                Distribuição por Tipo de Consumidor
              </h2>
            </div>
            <div className="space-y-4">
              {dadosTipoConsumidor && dadosTipoConsumidor.length > 0 ? (
                dadosTipoConsumidor.map((consumerType) => {
                  const totalConsumidores = dashboardData?.totalConsumers || clientesConsumidores.length;
                  const percentage = totalConsumidores > 0 ? ((consumerType.count / totalConsumidores) * 100).toFixed(0) : '0';
                  
                  return (
                    <div key={consumerType.consumerType} className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-slate-900">{consumerType.consumerType}</span>
                        <span className="text-lg font-bold text-slate-900">{percentage}%</span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600 mb-3">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-600" />
                          {consumerType.count} consumidores
                        </span>
                        <span className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-green-600" />
                          {consumerType.totalConsumption} kW/h
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-slate-500 text-center py-8 text-lg">
                  Nenhum dado de distribuição disponível
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Insights Rápidos */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-green-600 rounded-2xl p-8 shadow-2xl border border-slate-200 text-white">
          <div className="flex items-center mb-8">
            <Target className="h-8 w-8 text-white mr-4" />
            <h2 className="text-3xl font-bold">Insights do Sistema</h2>
          </div>
          
          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-slate-200 mb-3">Média da Porcentagem de Desconto</h3>
              <div className="flex items-center space-x-3">
                <TrendingDown className="h-8 w-8 text-green-400" />
                <p className="text-4xl font-bold text-white">
                  {formatarNumero(mediaDesconto)}%
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-slate-200 mb-3">Eficiência de Alocação</h3>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-400" />
                <p className="text-4xl font-bold text-white">
                  {totalCapacity > 0 ? ((totalCapacity - capacidadeNaoAlocada) / totalCapacity * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </div>

          {/* Utilização da Capacidade */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Capacidade Total de Geradores</h4>
              <p className="text-2xl font-bold text-white">
                {formatarNumero(totalCapacity)} kW
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Capacidade Não Alocada</h4>
              <p className="text-2xl font-bold text-white">
                {formatarNumero(capacidadeNaoAlocada)} kW
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Consumo Total</h4>
              <p className="text-2xl font-bold text-white">
                {formatarNumero(consumoTotalConsumidores)} kW/h
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Demanda Não Alocada</h4>
              <p className="text-2xl font-bold text-white">
                {formatarNumero(dadosConsumidoresNaoAlocados.totalKwh)} kW/h
              </p>
              <p className="text-xs text-slate-300 mt-1">
                {dadosConsumidoresNaoAlocados.quantidade} consumidores
              </p>
            </div>
          </div>

          {/* Status dos Geradores */}
          <div className="mt-8 flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-lg"></div>
              <span className="text-slate-200 font-medium">
                {geradores.filter(g => g.status === 'UNDER_ANALYSIS').length} em análise
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg"></div>
              <span className="text-slate-200 font-medium">
                {geradores.filter(g => g.status === 'AWAITING_ALLOCATION').length} aguardando alocação
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg"></div>
              <span className="text-slate-200 font-medium">
                {geradores.filter(g => g.status === 'ACTIVE').length} totalmente alocados
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

