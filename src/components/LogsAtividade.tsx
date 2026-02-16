import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Eye,
  Download,
  Shield,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { AuditLog, AuditLogsResponse } from '../types';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../types/services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Badge from './ui/Badge';
import Modal, { ModalFooter } from './ui/Modal';

export default function LogsAtividade() {
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    entityType: '',
    userId: '',
    page: 1,
    limit: 50
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();

      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.userId) queryParams.append('userId', filters.userId);

      queryParams.append('page', String(filters.page));
      queryParams.append('limit', String(filters.limit));

      const endpoint = `/audit/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: AuditLogsResponse = await api.get(endpoint);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      showError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      showError('Acesso negado. Apenas Super Administradores podem acessar esta área.');
      return;
    }
    fetchLogs();
  }, [user?.role, fetchLogs]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      action: '',
      entityType: '',
      userId: '',
      page: 1,
      limit: 50
    });
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entityType) queryParams.append('entityType', filters.entityType);
      if (filters.userId) queryParams.append('userId', filters.userId);

      const endpoint = `/audit/logs/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(endpoint);

      const csvContent = response.csvContent || '';
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccess('Logs exportados com sucesso!');
    } catch (error) {
      showError('Erro ao exportar logs');
    }
  };

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'CREATE':
        return { label: 'Criação', color: 'success' as const, icon: <div className="w-2 h-2 bg-emerald-500 rounded-full" /> };
      case 'UPDATE':
        return { label: 'Atualização', color: 'accent' as const, icon: <div className="w-2 h-2 bg-blue-500 rounded-full" /> };
      case 'DELETE':
        return { label: 'Exclusão', color: 'error' as const, icon: <div className="w-2 h-2 bg-red-500 rounded-full" /> };
      case 'LOGIN':
        return { label: 'Login', color: 'warning' as const, icon: <div className="w-2 h-2 bg-purple-500 rounded-full" /> };
      case 'LOGOUT':
        return { label: 'Logout', color: 'default' as const, icon: <div className="w-2 h-2 bg-slate-500 rounded-full" /> };
      default:
        return { label: action, color: 'default' as const, icon: <div className="w-2 h-2 bg-slate-400 rounded-full" /> };
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      'Consumer': 'Consumidor',
      'Generator': 'Gerador',
      'Representative': 'Representante',
      'User': 'Usuário'
    };
    return labels[entityType] || entityType;
  };

  const hasPrev = pagination.page > 1;
  const hasNext = pagination.page < pagination.pages;

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-50 p-6 rounded-full mb-6 animate-in zoom-in duration-300">
          <Shield className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900 mb-2">Acesso Restrito</h2>
        <p className="text-slate-500 max-w-md font-display">
          Esta área é exclusiva para Super Administradores.
        </p>
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
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">Logs de Atividade</h1>
                <p className="text-slate-500 font-medium text-sm font-display">Monitore todas as ações realizadas no sistema</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={exportLogs}
                className="bg-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                label="Usuário"
                placeholder="ID ou nome..."
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                icon={<User className="h-4 w-4" />}
              />
            </div>

            <Select
              label="Ação"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">Todas as ações</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Atualização</option>
              <option value="DELETE">Exclusão</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </Select>

            <Select
              label="Entidade"
              value={filters.entityType}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="Consumer">Consumidor</option>
              <option value="Generator">Gerador</option>
              <option value="Representative">Representante</option>
              <option value="User">Usuário</option>
            </Select>

            <Input
              label="Data Início"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />

            <Input
              label="Data Fim"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />

            <div className="md:col-span-4 lg:col-span-6 flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 font-display">Itens por página:</span>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                  className="border border-slate-200 rounded-lg text-sm p-1 bg-slate-50 focus:ring-accent focus:border-accent outline-none"
                >
                  {[20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={clearFilters}
                  size="sm"
                  className="rounded-full"
                >
                  Limpar Filtros
                </Button>
                <Button
                  onClick={() => fetchLogs()}
                  size="sm"
                  showArrow
                  className="rounded-full"
                >
                  Atualizar Lista
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Logs List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Ação</th>
                  <th className="px-6 py-4 whitespace-nowrap">Usuário</th>
                  <th className="px-6 py-4 whitespace-nowrap">Entidade</th>
                  <th className="px-6 py-4 whitespace-nowrap">IP / Origem</th>
                  <th className="px-6 py-4 whitespace-nowrap">Data</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">Carregando dados...</td></tr>
                )}
                {!loading && logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                        <Search className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 font-display">Nenhum registro encontrado</h3>
                      <p className="text-slate-500 mt-1 font-display">Tente ajustar seus filtros de busca.</p>
                    </td>
                  </tr>
                )}
                {!loading && logs.map((log) => {
                  const actionConfig = getActionConfig(log.action);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <Badge variant={actionConfig.color} className="font-display">
                          {actionConfig.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white">
                            {log.user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 font-display">{log.user?.name || 'Sistema'}</p>
                            <p className="text-xs text-slate-500 font-display">{log.user?.role || 'System'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900 font-display">{getEntityTypeLabel(log.entityType)}</p>
                          {log.entityId && (
                            <p className="text-xs text-slate-500 font-mono">ID: {log.entityId.substring(0, 8)}...</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-slate-600">
                          <Shield className="h-3 w-3 mr-2 text-slate-400" />
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            {log.ipAddress || 'Internal'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium font-display">
                            {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center mt-0.5 font-display">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="text-accent hover:text-accent-secondary hover:bg-accent/5 rounded-full"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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
              <div className="text-sm text-slate-500 font-display">
                Mostrando <span className="font-medium text-slate-900">{((pagination.page - 1) * pagination.limit) + 1}</span> até <span className="font-medium text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de <span className="font-medium text-slate-900">{pagination.total}</span> registros
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={!hasPrev}
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  className="p-2 rounded-lg get-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm border border-slate-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-slate-700 px-3 font-display">
                  Página {pagination.page} de {pagination.pages}
                </span>

                <button
                  disabled={!hasNext}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-white shadow-sm"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Detalhes da Atividade"
        description="Informações completas sobre o registro de auditoria."
        headerVariant="brand"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Ação Realizada</label>
                <div className="flex items-center mt-1">
                  <Badge variant={getActionConfig(selectedLog.action).color}>
                    {getActionConfig(selectedLog.action).label}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Data e Hora</label>
                <p className="text-slate-900 font-medium font-display">
                  {new Date(selectedLog.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Usuário Responsável</label>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {selectedLog.user?.name?.charAt(0) || '?'}
                  </div>
                  <span className="text-slate-900 flex-1 font-display">{selectedLog.user?.name || 'Sistema'}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Endereço IP</label>
                <p className="font-mono text-sm text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 inline-block">
                  {selectedLog.ipAddress || 'Não registrado'}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="space-y-3">
              <h4 className="font-medium text-slate-900 flex items-center gap-2 font-display">
                <Activity className="h-4 w-4 text-accent" />
                Dados da Entidade
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-sm text-slate-500 font-display">Tipo</span>
                  <span className="text-sm font-medium text-slate-900 font-display">{getEntityTypeLabel(selectedLog.entityType)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500 font-display">ID do Recurso</span>
                  <span className="text-xs font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                    {selectedLog.entityId}
                  </span>
                </div>
              </div>
            </div>

            {selectedLog.metadata && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Metadados Técnicos</label>
                <pre className="w-full p-4 bg-slate-900 text-slate-50 rounded-xl text-xs overflow-x-auto font-mono">
                  {JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {(selectedLog.oldValues || selectedLog.newValues) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedLog.oldValues && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Valores Antigos</label>
                    <pre className="w-full p-4 bg-slate-100 text-slate-700 rounded-xl text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.oldValues, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValues && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider font-display">Novos Valores</label>
                    <pre className="w-full p-4 bg-slate-100 text-slate-700 rounded-xl text-xs overflow-x-auto font-mono">
                      {JSON.stringify(selectedLog.newValues, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button onClick={() => setSelectedLog(null)} className="w-full sm:w-auto rounded-full">
            Fechar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
