import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import ErrorMessage from './common/ErrorMessage';
import {
  Users,
  Factory,
  TrendingUp,
  Zap,
  Activity,
  TrendingDown,
  CheckCircle,
  Target,
  Loader,
  Filter,
  Download,
  Bell,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useClientesGeradores } from '../hooks/useClientesGeradores';
import { useClientesConsumidores } from '../hooks/useClientesConsumidores';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { ConsumerStatus } from '../types';
import { api } from '../types/services/api';
import { useToast } from '../hooks/useToast';
import { useNavigation } from '../hooks/useNavigation';

export default function Dashboard() {
  const toast = useToast();
  const { navigate } = useNavigation();
  const { dashboardData, loading, error, filters, refetch, updateFilters, clearFilters } = useDashboard();
  const { clientes: geradores } = useClientesGeradores();
  const { clientes: clientesConsumidores } = useClientesConsumidores();
  const { representantes } = useRepresentantesComerciais();

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
    }, [] as Array<{ sourceType: string, count: number, totalPower: number }>);

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
    }, [] as Array<{ consumerType: string, count: number, totalConsumption: number }>);

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
    <div className="min-h-screen bg-slate-50/50">
      <div className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 font-medium">Visão geral do sistema</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 sm:h-10 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" /><span className="hidden sm:inline">Filtros</span>
            </button>
            <button
              onClick={exportDashboard}
              className="h-9 sm:h-10 rounded-xl bg-gradient-to-r from-accent to-accent-secondary px-3 sm:px-6 text-sm font-medium text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-accent/20 flex items-center gap-2"
            >
              <Download className="h-4 w-4" /><span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.title} className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-xl bg-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-accent ring-1 ring-slate-200 group-hover:from-accent group-hover:to-accent-secondary group-hover:text-white group-hover:ring-accent transition-all duration-300">
                      <Icon className="h-6 w-6" strokeWidth={2.2} />
                    </div>
                  </div>
                  {stat.change && (
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stat.trend === 'up'
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                      : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                      }`}>
                      {stat.trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900 tracking-tight font-display group-hover:text-accent transition-colors duration-300">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-500">{stat.title}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notificações */}
        <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-accent to-accent-secondary rounded-xl shadow-lg shadow-accent/20 mr-4 text-white">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-display font-semibold text-slate-900">Notificações</h2>
                <p className="text-sm text-slate-500">Ações pendentes que requerem sua atenção</p>
              </div>
            </div>
          </div>

          {/* Verificar se há notificações */}
          {(() => {
            const pendingChanges = dashboardData.summary?.pendingChangeRequests ?? 0;
            const pendingConsumers = dashboardData.summary?.pendingConsumers ?? 0;
            const hasNotifications = pendingChanges > 0 || pendingConsumers > 0 ||
              (dashboardData?.notifications?.pendingChangeRequests && dashboardData.notifications.pendingChangeRequests.length > 0);

            if (!hasNotifications) {
              return (
                /* Estado quando não há notificações - Design modernizado */
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-white rounded-2xl p-12 border border-blue-100/50 shadow-sm">
                  {/* Decoração de fundo */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                  <div className="relative flex flex-col items-center justify-center text-center">
                    {/* Ícone principal com animação */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-accent rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <div className="relative p-6 bg-gradient-to-br from-accent to-accent-secondary rounded-full shadow-xl shadow-accent/20 transform hover:scale-105 transition-transform duration-300">
                        <CheckCircle className="h-16 w-16 text-white" strokeWidth={2} />
                      </div>
                    </div>

                    {/* Texto principal */}
                    <h3 className="text-2xl font-display font-semibold text-slate-900 mb-3">
                      Tudo em dia!
                    </h3>
                    <p className="text-base text-slate-500 mb-8 max-w-md leading-relaxed">
                      Não há notificações pendentes no momento. O sistema está operando normalmente.
                    </p>

                    {/* Estatísticas rápidas */}
                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-100 shadow-sm">
                        <div className="text-xl font-display font-bold text-accent mb-0.5">0</div>
                        <div className="text-xs text-slate-500 font-medium">Mudanças</div>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-100 shadow-sm">
                        <div className="text-xl font-display font-bold text-accent mb-0.5">0</div>
                        <div className="text-xs text-slate-500 font-medium">Consumidores</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Badge de Mudanças Pendentes */}
                  {pendingChanges > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200 hover:border-yellow-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-yellow-500 rounded-xl">
                            <AlertCircle className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-display font-bold text-slate-900">Mudanças Pendentes</h3>
                            <p className="text-sm text-slate-600">Aguardando aprovação</p>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-yellow-600">
                          {pendingChanges}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('mudancas')}
                        className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <span>Ver Mudanças</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Badge de Consumidores Pendentes */}
                  {pendingConsumers > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-500 rounded-xl">
                            <Users className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-display font-bold text-slate-900">Consumidores Pendentes</h3>
                            <p className="text-sm text-slate-600">Aguardando aprovação</p>
                          </div>
                        </div>
                        <div className="text-4xl font-bold text-blue-600">
                          {pendingConsumers}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate('pendentes')}
                        className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        <span>Ver Consumidores</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Lista de Notificações de Mudanças */}
                {dashboardData?.notifications?.pendingChangeRequests && dashboardData.notifications.pendingChangeRequests.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Últimas Mudanças Solicitadas</h3>
                    <div className="space-y-3">
                      {dashboardData.notifications.pendingChangeRequests.slice(0, 5).map((request: any) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => navigate('mudancas')}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{request.consumerName}</p>
                            <p className="text-sm text-slate-600">
                              Por: {request.representativeName} • {request.changedFields.length} campo(s) alterado(s)
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(request.requestedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Histórico de Ações Recentes */}
        <div className="rounded-2xl border border-white/60 bg-white p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl shadow-lg shadow-slate-900/10 mr-4 text-white">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900">Histórico Recente</h2>
              <p className="text-sm text-slate-500">Últimas atividades do sistema</p>
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
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
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
        <div className="rounded-2xl border border-white/60 bg-white p-5 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-r from-accent to-accent-secondary rounded-xl shadow-lg shadow-accent/20 mr-4 text-white">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-semibold text-slate-900">Representantes Comerciais</h2>
              <p className="text-sm text-slate-500">Visão geral da equipe comercial</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
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

            {typeof dashboardData?.representatives?.averageCommissionRate === 'number' && (
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {dashboardData.representatives.averageCommissionRate.toFixed(2)}%
                </div>
                <div className="text-sm font-medium text-purple-700">Taxa Média</div>
              </div>
            )}
          </div>

          {/* Representantes por Estado */}
          {representantes && representantes.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-display font-semibold text-slate-800 mb-4">Distribuição por Estado</h3>
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
          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center">
                <Zap className="h-5 w-5 mr-3 text-accent" />
                Fonte de Energia
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
                        <span className="text-lg font-bold text-slate-900">
                          {source.sourceType === 'SOLAR' ? 'Solar' :
                            source.sourceType === 'WIND' ? 'Eólica' :
                              source.sourceType === 'HYDRO' ? 'Hidrelétrica' :
                                source.sourceType === 'BIOMASS' ? 'Biomassa' : source.sourceType}
                        </span>
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
          <div className="rounded-2xl border border-white/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center">
                <Users className="h-5 w-5 mr-3 text-accent" />
                Tipo de Consumidor
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
                        <span className="text-lg font-bold text-slate-900">
                          {consumerType.consumerType === 'COMMERCIAL' ? 'Comercial' :
                            consumerType.consumerType === 'RESIDENTIAL' ? 'Residencial' :
                              consumerType.consumerType === 'INDUSTRIAL' ? 'Industrial' :
                                consumerType.consumerType === 'RURAL' ? 'Rural' : consumerType.consumerType}
                        </span>
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
                          className="bg-gradient-to-r from-accent to-accent-secondary h-3 rounded-full transition-all duration-500"
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
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-accent rounded-2xl p-8 shadow-2xl shadow-accent/20 border border-white/10 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-white/10 rounded-xl mr-4 backdrop-blur-sm border border-white/10">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold font-display text-white">Insights do Sistema</h2>
            </div>

            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 font-display">Média da Porcentagem de Desconto</h3>
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-300">
                    <TrendingDown className="h-8 w-8" />
                  </div>
                  <p className="text-5xl font-bold text-white tracking-tight font-display">
                    {formatarNumero(mediaDesconto)}%
                  </p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-3 font-display">Eficiência de Alocação</h3>
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-full bg-accent/30 text-white">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <p className="text-5xl font-bold text-white tracking-tight font-display">
                    {totalCapacity > 0 ? ((totalCapacity - capacidadeNaoAlocada) / totalCapacity * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </div>

            {/* Utilização da Capacidade */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs uppercase tracking-wider font-semibold font-display text-blue-100 mb-2">Capacidade Total</h4>
                <p className="text-2xl font-bold text-white font-display">
                  {formatarNumero(totalCapacity)} <span className="text-sm font-normal text-white/60">kW</span>
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs uppercase tracking-wider font-semibold font-display text-blue-100 mb-2">Disponível</h4>
                <p className="text-2xl font-bold text-white font-display">
                  {formatarNumero(capacidadeNaoAlocada)} <span className="text-sm font-normal text-white/60">kW</span>
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs uppercase tracking-wider font-semibold font-display text-blue-100 mb-2">Consumo Total</h4>
                <p className="text-2xl font-bold text-white font-display">
                  {formatarNumero(consumoTotalConsumidores)} <span className="text-sm font-normal text-white/60">kW/h</span>
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-xs uppercase tracking-wider font-semibold font-display text-blue-100 mb-2">Demanda Pendente</h4>
                <p className="text-2xl font-bold text-white font-display">
                  {formatarNumero(dadosConsumidoresNaoAlocados.totalKwh)} <span className="text-sm font-normal text-white/60">kW/h</span>
                </p>
                <p className="text-xs text-blue-100 mt-1 flex items-center">
                  <Users className="h-3 w-3 mr-1" />
                  {dadosConsumidoresNaoAlocados.quantidade} consumidores
                </p>
              </div>
            </div>

            {/* Status dos Geradores */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
                <span className="text-white font-medium">
                  {geradores.filter(g => g.status === 'UNDER_ANALYSIS').length} em análise
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                <span className="text-white font-medium">
                  {geradores.filter(g => g.status === 'AWAITING_ALLOCATION').length} aguardando alocação
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                <span className="text-white font-medium">
                  {geradores.filter(g => g.status === 'ACTIVE').length} totalmente alocados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

