import { api } from './api';
import { SystemSettings, SystemStats, KwhPriceHistory } from '../index';

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
  }
};
