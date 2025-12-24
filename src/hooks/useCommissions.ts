import { useState, useCallback, useEffect } from 'react';
import { Commission, CommissionFilters } from '../types';
import { commissionService } from '../types/services/commissionService';
import { useAuth } from './useAuth';

export function useCommissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommissionFilters>({});
  const { isAuthenticated } = useAuth();

  const fetchCommissions = useCallback(async (appliedFilters?: CommissionFilters) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await commissionService.getAll(appliedFilters || {});
      setCommissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar comissões';
      setError(message);
      console.error('Erro ao buscar comissões:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchPendingCommissions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await commissionService.getPending();
      setCommissions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar comissões pendentes';
      setError(message);
      console.error('Erro ao buscar comissões pendentes:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const updateFilters = useCallback((newFilters: CommissionFilters) => {
    setFilters(newFilters);
    fetchCommissions(newFilters);
  }, [fetchCommissions]);

  const clearFilters = useCallback(() => {
    const clearedFilters: CommissionFilters = {};
    setFilters(clearedFilters);
    fetchCommissions(clearedFilters);
  }, [fetchCommissions]);

  const markAsPaid = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const updatedCommission = await commissionService.markAsPaid(id);
      setCommissions(prev => prev.map(c => c.id === id ? updatedCommission : c));
      return updatedCommission;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao marcar comissão como paga';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateCommissionsForExisting = useCallback(async () => {
    console.log('generateCommissionsForExisting - Iniciando...');
    try {
      setLoading(true);
      console.log('generateCommissionsForExisting - Chamando commissionService...');
      const result = await commissionService.generateCommissionsForExistingConsumers();
      console.log('generateCommissionsForExisting - Resultado do serviço:', result);
      // Recarregar comissões após gerar
      console.log('generateCommissionsForExisting - Recarregando comissões...');
      await fetchCommissions();
      console.log('generateCommissionsForExisting - Comissões recarregadas');
      return result;
    } catch (err) {
      console.error('generateCommissionsForExisting - Erro:', err);
      const message = err instanceof Error ? err.message : 'Erro ao gerar comissões';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCommissions]);

  const generateCommissionsForConsumer = useCallback(async (consumerId: string, consumerData?: any) => {
    console.log('generateCommissionsForConsumer - Iniciando para consumidor:', consumerId);
    console.log('generateCommissionsForConsumer - Dados do consumidor:', consumerData);
    try {
      setLoading(true);
      const result = await commissionService.generateCommissionsForConsumer(consumerId, consumerData);
      console.log('generateCommissionsForConsumer - Resultado:', result);
      
      // Recarregar comissões após gerar
      console.log('generateCommissionsForConsumer - Recarregando comissões...');
      await fetchCommissions();
      console.log('generateCommissionsForConsumer - Comissões recarregadas');
      
      return result;
    } catch (err) {
      console.error('generateCommissionsForConsumer - Erro:', err);
      const message = err instanceof Error ? err.message : 'Erro ao gerar comissões para o consumidor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCommissions]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchCommissions();
    }
  }, [isAuthenticated, fetchCommissions]);

  return {
    commissions,
    loading,
    error,
    filters,
    refetch: fetchCommissions,
    refetchPending: fetchPendingCommissions,
    updateFilters,
    clearFilters,
    markAsPaid,
    generateCommissionsForExisting,
    generateCommissionsForConsumer,
    currentFilters: filters
  };
}
