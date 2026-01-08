import { useState, useEffect, useCallback } from 'react';
import { api } from '../types/services/api';
import { AdminDashboard } from '../types';
import { useAuth } from './useAuth';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  period?: string;
}

export function useDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DashboardFilters>({ period: 'month' });
  const { isAuthenticated } = useAuth();

  const fetchDashboard = useCallback(async (appliedFilters?: DashboardFilters) => {
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
      
      const endpoint = `/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await api.get(endpoint);
      setDashboardData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const refetch = useCallback(async () => {
    await fetchDashboard();
  }, [fetchDashboard]);

  const updateFilters = useCallback((newFilters: DashboardFilters) => {
    setFilters(newFilters);
    fetchDashboard(newFilters);
  }, [fetchDashboard]);

  const clearFilters = useCallback(() => {
    const clearedFilters: DashboardFilters = { period: 'month' };
    setFilters(clearedFilters);
    fetchDashboard(clearedFilters);
  }, [fetchDashboard]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard();
    }
  }, [isAuthenticated]);

  return {
    dashboardData,
    loading,
    error,
    filters,
    refetch,
    updateFilters,
    clearFilters
  };
}

export function useGeneratorsBySource() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/dashboard/generators-by-source');
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  return { data, loading, error, refetch: fetchData };
}

export function useConsumersByType() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await api.get('/dashboard/consumers-by-type');
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  return { data, loading, error, refetch: fetchData };
}