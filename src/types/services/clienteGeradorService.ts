import { api } from './api';
import { ClienteGerador } from '../index';

export interface ClienteGeradorFilters {
  search?: string;
  status?: string;
  city?: string;
  state?: string;
  sourceType?: string;
}

export const clienteGeradorService = {
  async getAll(filters?: ClienteGeradorFilters): Promise<ClienteGerador[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const endpoint = `/generators${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  async getById(id: string): Promise<ClienteGerador> {
    return api.get(`/generators/${id}`);
  },

  async create(cliente: Omit<ClienteGerador, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClienteGerador> {
    return api.post('/generators', cliente);
  },

  async update(id: string, cliente: Partial<ClienteGerador>): Promise<ClienteGerador> {
    return api.patch(`/generators/${id}`, cliente);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/generators/${id}`);
  },

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySourceType: Record<string, number>;
    totalPower: number;
  }> {
    return api.get('/generators/statistics');
  },

  async getByState(): Promise<Record<string, ClienteGerador[]>> {
    return api.get('/generators/by-state');
  },

  async getBySourceType(): Promise<Record<string, ClienteGerador[]>> {
    return api.get('/generators/by-source-type');
  }
};