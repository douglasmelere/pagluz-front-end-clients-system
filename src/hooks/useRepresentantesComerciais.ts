import { useState, useEffect, useCallback, useRef } from 'react';
import { Representative, RepresentativeStatus } from '../types';
import { representanteComercialService, RepresentanteComercialFilters, RepresentanteComercialCreate, RepresentanteComercialUpdate } from '../types/services/representanteComercialService';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export function useRepresentantesComerciais() {
  const [representantes, setRepresentantes] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RepresentanteComercialFilters>({});
  const [statistics, setStatistics] = useState<any>(null);
  const toast = useToast();
  const { isAuthenticated } = useAuth();

  // Verificar se o toast está disponível
  useEffect(() => {
    if (!toast || typeof toast.showSuccess !== 'function' || typeof toast.showError !== 'function') {
      console.warn('Toast não está disponível corretamente:', toast);
    }
  }, [toast]);

  // Funções de toast com verificação de segurança
  const showSuccess = useCallback((message: string) => {
    if (toast && typeof toast.showSuccess === 'function') {
      toast.showSuccess(message);
    } else {
      console.warn('Toast não disponível para showSuccess:', message);
    }
  }, [toast]);

  const showError = useCallback((message: string) => {
    if (toast && typeof toast.showError === 'function') {
      toast.showError(message);
    } else {
      console.warn('Toast não disponível para showError:', message);
    }
  }, [toast]);

  // Buscar todos os representantes
  const fetchRepresentantes = useCallback(async (filters?: RepresentanteComercialFilters) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await representanteComercialService.getAll(filters);
      setRepresentantes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar representantes';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, showError]);

  // Buscar estatísticas
  const fetchStatistics = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const data = await representanteComercialService.getStatistics();
      setStatistics(data);
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
    }
  }, [isAuthenticated]);

  // Criar representante
  const createRepresentante = useCallback(async (representante: RepresentanteComercialCreate) => {
    try {
      setLoading(true);
      const newRepresentante = await representanteComercialService.create(representante);
      setRepresentantes(prev => [...prev, newRepresentante]);
      showSuccess('Representante criado com sucesso!');
      return newRepresentante;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar representante';
      setError(message);
      showError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Atualizar representante
  const updateRepresentante = useCallback(async (id: string, updates: RepresentanteComercialUpdate) => {
    try {
      setLoading(true);
      const updatedRepresentante = await representanteComercialService.update(id, updates);
      setRepresentantes(prev => 
        prev.map(rep => rep.id === id ? updatedRepresentante : rep)
      );
      showSuccess('Representante atualizado com sucesso!');
      return updatedRepresentante;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar representante';
      setError(message);
      showError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Deletar representante
  const deleteRepresentante = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await representanteComercialService.delete(id);
      setRepresentantes(prev => prev.filter(rep => rep.id !== id));
      showSuccess('Representante removido com sucesso!');
    } catch (err) {
      // Se o erro for de resposta vazia (comum em DELETE), considerar sucesso
      if (err instanceof Error && err.message.includes('Unexpected end of JSON input')) {
        setRepresentantes(prev => prev.filter(rep => rep.id !== id));
        showSuccess('Representante removido com sucesso!');
        return;
      }
      
      const message = err instanceof Error ? err.message : 'Erro ao remover representante';
      setError(message);
      showError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  // Atualizar status
  const updateStatus = useCallback(async (id: string, status: RepresentativeStatus) => {
    try {
      const updatedRepresentante = await representanteComercialService.updateStatus(id, status);
      setRepresentantes(prev => 
        prev.map(rep => rep.id === id ? updatedRepresentante : rep)
      );
      showSuccess(`Status atualizado para ${status}`);
      return updatedRepresentante;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar status';
      setError(message);
      showError(message);
      throw err;
    }
  }, [showSuccess, showError]);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: RepresentanteComercialFilters) => {
    setFilters(newFilters);
    fetchRepresentantes(newFilters);
  }, [fetchRepresentantes]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
    fetchRepresentantes();
  }, [fetchRepresentantes]);

  // Buscar representante por ID
  const getRepresentanteById = useCallback(async (id: string) => {
    try {
      return await representanteComercialService.getById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar representante';
      setError(message);
      showError(message);
      throw err;
    }
  }, [showError]);

  // Buscar representantes ativos
  const getActiveRepresentantes = useCallback(async () => {
    try {
      return await representanteComercialService.getActiveRepresentatives();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar representantes ativos';
      setError(message);
      showError(message);
      throw err;
    }
  }, [showError]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchRepresentantes();
      fetchStatistics();
    }
  }, [isAuthenticated]);

  return {
    representantes,
    loading,
    error,
    filters,
    statistics,
    fetchRepresentantes,
    createRepresentante,
    updateRepresentante,
    deleteRepresentante,
    updateStatus,
    applyFilters,
    clearFilters,
    getRepresentanteById,
    getActiveRepresentantes,
    setError
  };
}
