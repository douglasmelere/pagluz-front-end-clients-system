import { api } from './api';
import { SystemSettings, SystemStats, KwhPriceHistory } from '../index';

export interface FioBPercentageSetting {
  id: string;
  key: string;
  value: number;
  description: string;
  updatedAt: string;
}

export interface FioBHistory {
  id: string;
  value: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const settingsService = {
  async getKwhPrice(): Promise<number> {
    return api.get('/settings/kwh-price');
  },

  async setKwhPrice(price: number): Promise<{ price: number; message: string }> {
    return api.post('/settings/kwh-price', { price });
  },

  async getKwhPriceHistory(): Promise<KwhPriceHistory[]> {
    return api.get('/settings/kwh-price/history');
  },

  async getSystemStats(): Promise<SystemStats> {
    return api.get('/settings/stats');
  },

  async getSettings(): Promise<SystemSettings> {
    return api.get('/settings');
  },

  async getFioBPercentage(): Promise<number | null> {
    const data = await api.get('/settings/fio-b-percentage');
    if (data == null) return null;
    // Suporta { value: 65 } ou número direto
    if (typeof data === 'number') return data;
    if (typeof data?.value === 'number') return data.value;
    return null;
  },

  async setFioBPercentage(percentage: number): Promise<FioBPercentageSetting> {
    return api.post('/settings/fio-b-percentage', { percentage });
  },

  async getFioBHistory(): Promise<FioBHistory[]> {
    return api.get('/settings/fio-b-percentage/history');
  },
};
