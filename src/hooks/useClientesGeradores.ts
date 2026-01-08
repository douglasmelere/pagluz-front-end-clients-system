import { useState, useCallback, useEffect } from 'react';
import { Generator } from '../types';
import { api } from '../types/services/api';
import { useAuth } from './useAuth';

export interface ClienteGeradorFilters {
  search?: string;
  status?: string;
  sourceType?: string;
  city?: string;
  state?: string;
}

export function useClientesGeradores() {
  const [clientes, setClientes] = useState<Generator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClienteGeradorFilters>({});
  const { isAuthenticated } = useAuth();

  const fetchClientes = useCallback(async (appliedFilters?: ClienteGeradorFilters) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      
      if (appliedFilters) {
        Object.entries(appliedFilters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString());
        });
      }
      
      const endpoint = `/generators${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await api.get(endpoint);
      setClientes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar geradores';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refetch = useCallback(async () => {
    await fetchClientes();
  }, [fetchClientes]);

  const updateFilters = useCallback((newFilters: ClienteGeradorFilters) => {
    setFilters(newFilters);
    fetchClientes(newFilters);
  }, [fetchClientes]);

  const clearFilters = useCallback(() => {
    const clearedFilters: ClienteGeradorFilters = {};
    setFilters(clearedFilters);
    fetchClientes(clearedFilters);
  }, [fetchClientes]);

  const createCliente = useCallback(async (cliente: Omit<Generator, 'id' | 'createdAt' | 'updatedAt' | 'consumers'>) => {
    try {
      setLoading(true);
      const newCliente = await api.post('/generators', cliente);
      setClientes(prev => [...prev, newCliente]);
      return newCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar gerador';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCliente = useCallback(async (cliente: Partial<Generator> & { id: string }) => {
    try {
      setLoading(true);
      const { id, ...data } = cliente;
      const updatedCliente = await api.patch(`/generators/${id}`, data);
      setClientes(prev => prev.map(c => c.id === id ? updatedCliente : c));
      return updatedCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar gerador';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await api.delete(`/generators/${id}`);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar gerador';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchClientes();
    }
  }, [isAuthenticated]);

  return {
    clientes,
    loading,
    error,
    filters,
    refetch,
    updateFilters,
    clearFilters,
    currentFilters: filters,
    createCliente,
    updateCliente,
    deleteCliente,
    createLoading: loading,
    updateLoading: loading,
    deleteLoading: loading
  };
}

// Hook para estatísticas
export function useClienteGeradorStats() {
  return {
    data: null,
    loading: false,
    error: null,
    refetch: async () => {}
  };
}