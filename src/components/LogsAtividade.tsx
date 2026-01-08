import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Calendar, User, Activity, Eye, Download, Shield } from 'lucide-react';
import { AuditLog, AuditLogsResponse } from '../types';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../types/services/api';
import Card from './common/Card';
import Button from './common/Button';

export default function LogsAtividade() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    action: '',
    entityType: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      // Adicionar página atual
      queryParams.append('page', String(pagination.page));
      queryParams.append('limit', String(pagination.limit));
      
      const endpoint = `/audit/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response: AuditLogsResponse = await api.get(endpoint);
      setLogs(response.logs);
      setPagination(response.pagination);
    } catch (error) {
      showError('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, showError]);

  // Verificar se o usuário é SUPER_ADMIN
  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      showError('Acesso negado. Apenas Super Administradores podem acessar esta área.');
      return;
    }
    
    fetchLogs();
  }, [user?.role, fetchLogs]);

  // Recarregar logs quando a página mudar
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchLogs();
    }
  }, [pagination.page, fetchLogs, user?.role]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      action: '',
      entityType: '',
      userId: ''
    });
  };

  const exportLogs = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      const endpoint = `/audit/logs/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await api.get(endpoint);
      
      // Criar e baixar arquivo CSV
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'UPDATE':
        return <div className="w-2 h-2 bg-blue-500 rounded-full" />;
      case 'DELETE':
        return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      case 'LOGIN':
        return <div className="w-2 h-2 bg-purple-500 rounded-full" />;
      case 'LOGOUT':
        return <div className="w-2 h-2 bg-gray-500 rounded-full" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Criação';
      case 'UPDATE':
        return 'Atualização';
      case 'DELETE':
        return 'Exclusão';
      case 'LOGIN':
        return 'Login';
      case 'LOGOUT':
        return 'Logout';
      default:
        return action;
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'Consumer':
        return 'Consumidor';
      case 'Generator':
        return 'Gerador';
      case 'Representative':
        return 'Representante';
      case 'User':
        return 'Usuário';
      default:
        return entityType;
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-6">
        <Card>
          <div className="text-center py-8">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Apenas Super Administradores podem acessar esta área.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Logs de Atividade</h1>
        <p className="text-gray-600">Monitore todas as atividades e mudanças no sistema</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </Button>
        
        <Button
          onClick={exportLogs}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="ID ou nome do usuário"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ação
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todas as ações</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Atualização</option>
                <option value="DELETE">Exclusão</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Entidade
              </label>
              <select
                value={filters.entityType}
                onChange={(e) => handleFilterChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos os tipos</option>
                <option value="Consumer">Consumidor</option>
                <option value="Generator">Gerador</option>
                <option value="Representative">Representante</option>
                <option value="User">Usuário</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando logs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Ação</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuário</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Entidade</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">IP</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Data/Hora</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs && logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-gray-700">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {log.user?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.user?.name || 'Usuário Desconhecido'}</p>
                          <p className="text-xs text-gray-500">{log.user?.role || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {getEntityTypeLabel(log.entityType)}
                        </p>
                        {log.entityId && (
                          <p className="text-xs text-gray-500">ID: {log.entityId}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {log.ipAddress || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.createdAt).toLocaleTimeString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Implementar modal com detalhes completos
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      Nenhum log de auditoria encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Paginação */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((pagination.page || 1) - 1)}
              disabled={(pagination.page || 1) <= 1}
            >
              Anterior
            </Button>
            
            <span className="text-sm text-gray-600">
              Página {pagination.page || 1} de {pagination.pages || 1}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((pagination.page || 1) + 1)}
              disabled={(pagination.page || 1) >= (pagination.pages || 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
