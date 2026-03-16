import { useState, useCallback, useEffect } from 'react';
import { SystemSettings, SystemStats, KwhPriceHistory } from '../types';
import { settingsService, FioBHistory } from '../types/services/settingsService';
import { useAuth } from './useAuth';

export function useSettings() {
  const [kwhPrice, setKwhPrice] = useState<number | null>(null);
  const [kwhPriceHistory, setKwhPriceHistory] = useState<KwhPriceHistory[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  
  const [fioBPercentage, setFioBPercentage] = useState<number | null>(null);
  const [fioBHistory, setFioBHistory] = useState<FioBHistory[]>([]);
  const [fioBError, setFioBError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchKwhPrice = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const price = await settingsService.getKwhPrice();
      setKwhPrice(price);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar preço do kWh';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchKwhPriceHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getKwhPriceHistory();
      setKwhPriceHistory(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchSystemStats = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSystemStats();
      setSystemStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const setKwhPriceValue = useCallback(async (price: number) => {
    try {
      setLoading(true);
      setError(null);
      const result = await settingsService.setKwhPrice(price);
      // Recarregar dados após atualizar
      await fetchKwhPrice();
      await fetchKwhPriceHistory();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar preço do kWh';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchKwhPrice, fetchKwhPriceHistory]);

  const fetchFioBPercentage = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setFioBError(null);
      const val = await settingsService.getFioBPercentage();
      setFioBPercentage(val);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar Fio B';
      setFioBError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchFioBHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setFioBError(null);
      const data = await settingsService.getFioBHistory();
      if (Array.isArray(data)) {
        setFioBHistory(data);
      } else {
        setFioBHistory([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico do Fio B';
      setFioBError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const setFioBPercentageValue = useCallback(async (percentage: number) => {
    try {
      setLoading(true);
      setFioBError(null);
      const result = await settingsService.setFioBPercentage(percentage);
      await fetchFioBPercentage();
      await fetchFioBHistory();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar Fio B';
      setFioBError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFioBPercentage, fetchFioBHistory]);

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchKwhPrice();
      fetchKwhPriceHistory();
      fetchSystemStats();
      fetchFioBPercentage();
      fetchFioBHistory();
    }
  }, [isAuthenticated, fetchKwhPrice, fetchKwhPriceHistory, fetchSystemStats, fetchFioBPercentage, fetchFioBHistory]);

  return {
    kwhPrice,
    kwhPriceHistory,
    systemStats,
    loading,
    error,
    fetchKwhPrice,
    fetchKwhPriceHistory,
    fetchSystemStats,
    setKwhPriceValue,
    fioBPercentage,
    fioBHistory,
    fioBError,
    fetchFioBPercentage,
    fetchFioBHistory,
    setFioBPercentageValue
  };
}
