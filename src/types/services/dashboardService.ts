import { api } from './api';

// Interface atualizada para corresponder ao backend
export interface DashboardData {
  summary: {
    totalGenerators: number;
    totalConsumers: number;
    totalInstalledPower: number;
    newClientsThisWeek: number;
    newGeneratorsThisWeek: number;
    newConsumersThisWeek: number;
  };
  stateDistribution: Array<{
    state: string;
    generators: number;
    totalInstalledPower: number;
    consumers: number;
    totalConsumption: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'generator' | 'consumer';
    name: string;
    subtype: string;
    createdAt: string;
  }>;
  insights: {
    totalMonthlyConsumption: number;
    allocationRate: number;
    estimatedMonthlySavings: number;
    totalAllocatedEnergy: number;
    capacityUtilization: {
      totalCapacity: number;
      allocatedCapacity: number;
      availableCapacity: number;
      utilizationRate: number;
    };
    generatorStatus?: {
      underAnalysis: number;
      awaitingAllocation: number;
    };
  };
}

export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    return api.get('/dashboard');
  },

  async getGeneratorsBySource(): Promise<Record<string, number>> {
    return api.get('/dashboard/generators-by-source');
  },

  async getConsumersByType(): Promise<Record<string, number>> {
    return api.get('/dashboard/consumers-by-type');
  }
};