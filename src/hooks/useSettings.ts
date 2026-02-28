import { useState, useCallback, useEffect } from 'react';
import { SystemStats, KwhPriceHistory } from '../types';
import { settingsService, FioBHistory } from '../types/services/settingsService';
import { useAuth } from './useAuth';

export function useSettings() {
  const [kwhPrice, setKwhPrice] = useState<number | null>(null);
  const [kwhPriceHistory, setKwhPriceHistory] = useState<KwhPriceHistory[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
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

  // --- Fio B ---
  const [fioBPercentage, setFioBPercentage] = useState<number | null>(null);
  const [fioBHistory, setFioBHistory] = useState<FioBHistory[]>([]);
  const [fioBLoading, setFioBLoading] = useState(false);
  const [fioBError, setFioBError] = useState<string | null>(null);

  const fetchFioBPercentage = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setFioBLoading(true);
      setFioBError(null);
      const value = await settingsService.getFioBPercentage();
      setFioBPercentage(value);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar porcentagem do Fio B';
      setFioBError(message);
    } finally {
      setFioBLoading(false);
    }
  }, [isAuthenticated]);

  const fetchFioBHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setFioBLoading(true);
      setFioBError(null);
      const data = await settingsService.getFioBHistory();
      setFioBHistory(data);
      // Fallback: se o GET retornou null mas o histórico tem um item ativo, usa esse valor
      const activeItem = data.find(item => item.isActive);
      if (activeItem) {
        setFioBPercentage(prev => prev ?? activeItem.value);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar histórico do Fio B';
      setFioBError(message);
    } finally {
      setFioBLoading(false);
    }
  }, [isAuthenticated]);

  const setFioBPercentageValue = useCallback(async (percentage: number) => {
    try {
      setFioBLoading(true);
      setFioBError(null);
      const result = await settingsService.setFioBPercentage(percentage);
      setFioBPercentage(result.value);
      await fetchFioBHistory();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar porcentagem do Fio B';
      setFioBError(message);
      throw err;
    } finally {
      setFioBLoading(false);
    }
  }, [fetchFioBHistory]);

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
    // Fio B
    fioBPercentage,
    fioBHistory,
    fioBLoading,
    fioBError,
    fetchFioBPercentage,
    fetchFioBHistory,
    setFioBPercentageValue,
  };
}
