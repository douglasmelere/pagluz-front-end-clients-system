import { api } from './api';
import { Commission, CommissionFilters, CreateCommissionRequest } from '../index';

export const commissionService = {
  async getAll(filters?: CommissionFilters): Promise<Commission[]> {
    const queryParams = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `/commissions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  async getPending(): Promise<Commission[]> {
    return api.get('/commissions/pending');
  },

  async getById(id: string): Promise<Commission> {
    return api.get(`/commissions/${id}`);
  },

  async create(commission: CreateCommissionRequest): Promise<Commission> {
    return api.post('/commissions', commission);
  },

  async markAsPaid(id: string): Promise<Commission> {
    return api.post(`/commissions/${id}/mark-paid`, {});
  },

  async getStats(): Promise<{
    totalCommissions: number;
    totalCommissionsValue: number;
    pendingCommissions: number;
    paidCommissions: number;
    totalConsumers: number;
    totalRepresentatives: number;
    currentKwhPrice: number;
    lastUpdated: string;
  }> {
    return api.get('/commissions/admin/stats');
  },

  async generateCommissionsForExistingConsumers(): Promise<{
    totalProcessed: number;
    successful: number;
    errors: number;
    results: Array<{
      consumerId: string;
      consumerName: string;
      representativeId: string;
      representativeName: string;
      commissionValue: number;
      status: string;
    }>;
  }> {
    try {
      const result = await api.post('/consumers/generate-commissions', {});
      return result;
    } catch (error) {
      throw error;
    }
  },

  async generateCommissionsForConsumer(consumerId: string, consumerData?: any): Promise<{
    consumerId: string;
    consumerName: string;
    representativeId: string;
    representativeName: string;
    commissionValue: number;
    status: string;
  }> {
    try {
      // Enviar dados completos do consumidor para o endpoint
      const requestData = {
        consumerId: consumerId,
        consumerData: consumerData
      };
      
      const result = await api.post('/consumers/generate-commissions-all', requestData);
      
      // Se o endpoint retornou dados específicos para este consumidor
      if (result && result.results && result.results.length > 0) {
        const consumerResult = result.results.find((r: any) => r.consumerId === consumerId);
        if (consumerResult) {
          return consumerResult;
        }
      }
      
      // Se não encontrou comissão específica, retornar status de não gerado
      return {
        consumerId,
        consumerName: consumerData?.name || 'N/A',
        representativeId: consumerData?.representativeId || 'N/A',
        representativeName: consumerData?.representativeName || 'N/A',
        commissionValue: 0,
        status: 'NOT_GENERATED'
      };
    } catch (error) {
      throw error;
    }
  }
};
