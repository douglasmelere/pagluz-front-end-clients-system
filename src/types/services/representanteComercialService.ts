import { api } from './api';
import { Representative, RepresentativeStatus } from '../index';

export interface RepresentanteComercialFilters {
  search?: string;
  status?: RepresentativeStatus;
  city?: string;
  state?: string;
  specialization?: string;
}

export interface RepresentanteComercialCreate {
  name: string;
  email: string;
  password: string;
  cpfCnpj: string;
  phone: string;
  city: string;
  state: string;
  specializations: string[];
  notes?: string;
}

export interface RepresentanteComercialUpdate {
  name?: string;
  email?: string;
  cpfCnpj?: string;
  phone?: string;
  city?: string;
  state?: string;
  status?: RepresentativeStatus;
  specializations?: string[];
  notes?: string;
}

export const representanteComercialService = {
  async getAll(filters?: RepresentanteComercialFilters): Promise<Representative[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const endpoint = `/representatives${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  async getById(id: string): Promise<Representative> {
    return api.get(`/representatives/${id}`);
  },

  async create(representante: RepresentanteComercialCreate): Promise<Representative> {
    return api.post('/representatives', representante);
  },

  async update(id: string, representante: RepresentanteComercialUpdate): Promise<Representative> {
    return api.patch(`/representatives/${id}`, representante);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/representatives/${id}`);
  },

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byState: Record<string, number>;
  }> {
    try {
      const response = await api.get('/representatives/statistics');
      
      // Mapear a resposta da API para o formato esperado pelo frontend
      const byStatus: Record<string, number> = {};
      if (response.representativesByStatus) {
        response.representativesByStatus.forEach((item: any) => {
          byStatus[item.status] = item.count;
        });
      }
      
      const byState: Record<string, number> = {};
      if (response.representativesByState) {
        response.representativesByState.forEach((item: any) => {
          byState[item.state] = item.count;
        });
      }
      
      return {
        total: response.totalRepresentatives || 0,
        byStatus,
        byState,
      };
    } catch (error: any) {
      // Se o endpoint não existir ainda, retornar estrutura padrão
      if (error && typeof error.message === 'string' && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        return {
          total: 0,
          byStatus: {},
          byState: {},
        };
      }
      throw error;
    }
  },

  async getByState(): Promise<Record<string, Representative[]>> {
    try {
      return await api.get('/representatives/by-state');
    } catch (error: any) {
      // Se o endpoint não existir, retornar estrutura vazia
      if (error && typeof error.message === 'string' && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        return {};
      }
      throw error;
    }
  },

  async getBySpecialization(): Promise<Record<string, Representative[]>> {
    try {
      return await api.get('/representatives/by-specialization');
    } catch (error: any) {
      // Se o endpoint não existir, retornar estrutura vazia
      if (error && typeof error.message === 'string' && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        return {};
      }
      throw error;
    }
  },

  async getActiveRepresentatives(): Promise<Representative[]> {
    try {
      return await api.get('/representatives/active');
    } catch (error: any) {
      // Se o endpoint não existir, retornar lista vazia
      if (error && typeof error.message === 'string' && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        return [];
      }
      throw error;
    }
  },

  async updateStatus(id: string, status: RepresentativeStatus): Promise<Representative> {
    // Usar o endpoint de update geral em vez de um endpoint específico para status
    return api.patch(`/representatives/${id}`, { status });
  },

  async getConsumersByRepresentative(id: string): Promise<any[]> {
    try {
      return await api.get(`/representatives/${id}/consumers`);
    } catch (error: any) {
      // Se o endpoint não existir, retornar lista vazia
      if (error && typeof error.message === 'string' && (error.message.includes('404') || error.message.toLowerCase().includes('not found'))) {
        return [];
      }
      throw error;
    }
  }
};
