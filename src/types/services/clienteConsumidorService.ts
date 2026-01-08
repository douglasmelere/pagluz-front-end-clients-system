import { api } from './api';
import { ClienteConsumidor } from '../index';

export interface ClienteConsumidorFilters {
  search?: string;
  status?: string;
  consumerType?: string;
  city?: string;
  state?: string;
}

export const clienteConsumidorService = {
  async getAll(filters?: ClienteConsumidorFilters): Promise<ClienteConsumidor[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }
    
    const endpoint = `/consumers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  async getById(id: string): Promise<ClienteConsumidor> {
    return api.get(`/consumers/${id}`);
  },

  async create(cliente: Omit<ClienteConsumidor, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClienteConsumidor> {
    // Usar endpoint padrão para administradores
    return api.post('/consumers', cliente);
  },

  async update(id: string, cliente: Partial<ClienteConsumidor>): Promise<ClienteConsumidor> {
    return api.patch(`/consumers/${id}`, cliente);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/consumers/${id}`);
  },

  async getStatistics(): Promise<any> {
    return api.get('/consumers/statistics');
  },

  async getByState(): Promise<Record<string, ClienteConsumidor[]>> {
    return api.get('/consumers/by-state');
  },
  
  // <<< MUDANÇA AQUI: Corrigindo o payload conforme a documentação da API
  // O endpoint é POST /consumers/{id}/allocate, e o corpo deve conter o ID do gerador.
  async allocate(clienteId: string, generatorId: string, percentage: number): Promise<ClienteConsumidor> {
    return api.post(`/consumers/${clienteId}/allocate`, {
      generatorId, // O corpo da requisição deve enviar o ID do gerador
      allocatedPercentage: percentage
    });
  },

  async deallocate(clienteId: string): Promise<ClienteConsumidor> {
    // A documentação indica um POST sem corpo para desalocar
    return api.post(`/consumers/${clienteId}/deallocate`, {});
  }
  ,
  // Lista consumidores pendentes de aprovação com filtros e paginação
  async getPending(params: {
    state?: string;
    city?: string;
    representativeId?: string;
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    page?: number;
    limit?: number;
  }): Promise<{
    consumers: ClienteConsumidor[];
    pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  }> {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
    });
    return api.get(`/consumers/pending${qs.toString() ? `?${qs.toString()}` : ''}`);
  },

  // Aprova um consumidor pendente
  async approve(id: string): Promise<void> {
    // Nosso helper api.post sempre envia body; enviar {} para manter consistência
    await api.post(`/consumers/${id}/approve`, {});
  },

  // Rejeita um consumidor pendente com motivo opcional
  async reject(id: string, reason?: string): Promise<void> {
    await api.post(`/consumers/${id}/reject`, { reason });
  }
};