import { useState, useCallback, useEffect } from 'react';
import { SystemSettings, SystemStats, KwhPriceHistory } from '../types';
import { settingsService } from '../types/services/settingsService';
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
      console.error('Erro ao buscar preço do kWh:', err);
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
      console.error('Erro ao buscar histórico:', err);
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
      console.error('Erro ao buscar estatísticas:', err);
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

  // Carregar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchKwhPrice();
      fetchKwhPriceHistory();
      fetchSystemStats();
    }
  }, [isAuthenticated, fetchKwhPrice, fetchKwhPriceHistory, fetchSystemStats]);

  return {
    kwhPrice,
    kwhPriceHistory,
    systemStats,
    loading,
    error,
    fetchKwhPrice,
    fetchKwhPriceHistory,
    fetchSystemStats,
    setKwhPriceValue
  };
}
