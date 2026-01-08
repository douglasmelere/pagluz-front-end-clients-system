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
    try {
      setLoading(true);
      const result = await commissionService.generateCommissionsForExistingConsumers();
      // Recarregar comissões após gerar
      await fetchCommissions();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar comissões';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCommissions]);

  const generateCommissionsForConsumer = useCallback(async (consumerId: string, consumerData?: any) => {
    try {
      setLoading(true);
      const result = await commissionService.generateCommissionsForConsumer(consumerId, consumerData);
      
      // Recarregar comissões após gerar
      await fetchCommissions();
      
      return result;
    } catch (err) {
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
