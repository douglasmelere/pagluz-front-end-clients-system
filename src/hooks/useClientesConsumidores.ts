import { useState, useCallback, useEffect } from 'react';
import { Consumer } from '../types';
import { api } from '../types/services/api';
import { useAuth } from './useAuth';
import { clienteConsumidorService } from '../types/services/clienteConsumidorService';

export interface ClienteConsumidorFilters {
  search?: string;
  status?: string;
  consumerType?: string;
  city?: string;
  state?: string;
  generatorId?: string;
}

export function useClientesConsumidores() {
  const [clientes, setClientes] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ClienteConsumidorFilters>({});
  const { isAuthenticated } = useAuth();

  const fetchClientes = useCallback(async (appliedFilters?: ClienteConsumidorFilters) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await clienteConsumidorService.getAll(appliedFilters || {});
      setClientes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar consumidores';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refetch = useCallback(async () => {
    await fetchClientes();
  }, [fetchClientes]);

  const updateFilters = useCallback((newFilters: ClienteConsumidorFilters) => {
    setFilters(newFilters);
    fetchClientes(newFilters);
  }, [fetchClientes]);

  const clearFilters = useCallback(() => {
    const clearedFilters: ClienteConsumidorFilters = {};
    setFilters(clearedFilters);
    fetchClientes(clearedFilters);
  }, [fetchClientes]);

  const createCliente = useCallback(async (cliente: Omit<Consumer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const newCliente = await clienteConsumidorService.create(cliente);
      setClientes(prev => [...prev, newCliente]);
      return newCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar consumidor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCliente = useCallback(async (cliente: Partial<Consumer> & { id: string }) => {
    try {
      setLoading(true);
      const { id, ...data } = cliente;
      const updatedCliente = await clienteConsumidorService.update(id, data);
      setClientes(prev => prev.map(c => c.id === id ? updatedCliente : c));
      return updatedCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar consumidor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCliente = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await clienteConsumidorService.delete(id);
      setClientes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao deletar consumidor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para alocar consumidor a um gerador
  const allocateToGenerator = useCallback(async (clienteId: string, generatorId: string, percentage: number) => {
    try {
      setLoading(true);
      const updatedCliente = await clienteConsumidorService.allocate(clienteId, generatorId, percentage);
      setClientes(prev => prev.map(c => c.id === clienteId ? updatedCliente : c));
      return updatedCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alocar consumidor';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para desalocar consumidor de um gerador
  const deallocateFromGenerator = useCallback(async (clienteId: string) => {
    try {
      setLoading(true);
      const updatedCliente = await clienteConsumidorService.deallocate(clienteId);
      setClientes(prev => prev.map(c => c.id === clienteId ? updatedCliente : c));
      return updatedCliente;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao desalocar consumidor';
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
    allocateToGenerator,
    deallocateFromGenerator,
    createLoading: loading,
    updateLoading: loading,
    deleteLoading: loading
  };
}