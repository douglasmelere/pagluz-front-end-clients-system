import { api } from './api';

export enum ChangeRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface ChangeRequest {
  id: string;
  consumerId: string;
  representativeId: string;
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  changedFields: string[];
  status: ChangeRequestStatus;
  requestedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  consumer: {
    id: string;
    name: string;
    cpfCnpj: string;
    ucNumber: string;
  };
  representative: {
    id: string;
    name: string;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface ChangeRequestPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ChangeRequestsResponse {
  data: ChangeRequest[];
  pagination: ChangeRequestPagination;
}

export const changeRequestService = {
  // Listar mudanças pendentes
  async getPending(params?: {
    page?: number;
    limit?: number;
  }): Promise<ChangeRequestsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const endpoint = `/consumers/change-requests/pending${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get(endpoint);
  },

  // Aprovar uma mudança
  async approve(changeRequestId: string): Promise<void> {
    await api.post(`/consumers/change-requests/${changeRequestId}/approve`, {});
  },

  // Rejeitar uma mudança
  async reject(changeRequestId: string, reason: string): Promise<void> {
    await api.post(`/consumers/change-requests/${changeRequestId}/reject`, {
      rejectionReason: reason
    });
  }
};







