// Enums
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR',
  REPRESENTATIVE = 'REPRESENTATIVE'
}

export enum RepresentativeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED'
}

export enum ConsumerStatus {
  AVAILABLE = 'AVAILABLE',
  ALLOCATED = 'ALLOCATED',
  IN_PROCESS = 'IN_PROCESS',
  CONVERTED = 'CONVERTED'
}

export enum ConsumerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  RURAL = 'RURAL',
  PUBLIC_POWER = 'PUBLIC_POWER'
}

export enum PhaseType {
  MONOPHASIC = 'MONOPHASIC',
  BIPHASIC = 'BIPHASIC',
  TRIPHASIC = 'TRIPHASIC'
}

export enum DocumentType {
  CPF = 'CPF',
  CNPJ = 'CNPJ'
}

export enum SourceType {
  SOLAR = 'SOLAR',
  HYDRO = 'HYDRO',
  BIOMASS = 'BIOMASS',
  WIND = 'WIND'
}

export enum GeneratorStatus {
  UNDER_ANALYSIS = 'UNDER_ANALYSIS',
  AWAITING_ALLOCATION = 'AWAITING_ALLOCATION',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum CommissionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  CALCULATED = 'CALCULATED'
}

// Interfaces de Autenticação
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string;
  loginCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interfaces de Representantes
export interface CreateRepresentativeRequest {
  name: string;
  email: string;
  password: string;
  cpfCnpj: string;
  phone: string;
  city: string;
  state: string;
  specializations?: string[];
  notes?: string;
}

export interface Representative {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  city: string;
  state: string;
  specializations: string[];
  status: RepresentativeStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  loginCount: number;
  _count: {
    Consumer: number;
  };
}

// Interfaces de Consumidores
export interface CreateConsumerRequest {
  name: string;
  documentType: DocumentType;
  cpfCnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  ucNumber: string;
  concessionaire: string;
  city: string;
  state: string;
  consumerType: ConsumerType;
  phase: PhaseType;
  averageMonthlyConsumption: number;
  discountOffered: number;
  status?: ConsumerStatus;
  allocatedPercentage?: number;
  generatorId?: string;
  representativeId?: string;
  // Campos opcionais
  representativeName?: string;
  representativeRg?: string;
  receiveWhatsapp?: boolean;
  complement?: string;
  birthDate?: string;
  observations?: string;
  arrivalDate?: string;
}

export interface Consumer {
  id: string;
  name: string;
  documentType: DocumentType;
  cpfCnpj: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  zipCode: string;
  ucNumber: string;
  concessionaire: string;
  city: string;
  state: string;
  consumerType: ConsumerType;
  phase: PhaseType;
  averageMonthlyConsumption: number;
  discountOffered: number;
  status: ConsumerStatus;
  allocatedPercentage: number | null;
  generatorId: string | null;
  representativeId: string | null;
  // Campos opcionais
  representativeName?: string;
  representativeRg?: string;
  receiveWhatsapp?: boolean;
  complement?: string;
  birthDate?: string;
  observations?: string;
  arrivalDate?: string;
  createdAt: string;
  updatedAt: string;
  generator?: Generator;
  Representative?: Representative;
  // Campos de fatura
  invoiceUrl?: string;
  invoiceFileName?: string;
  invoiceUploadedAt?: string;
  invoiceScannedData?: {
    text?: string;
    confidence?: number;
    extractedData?: {
      ucNumber?: string;
      consumption?: number;
      value?: number;
      dueDate?: string;
    };
  };
}

// Interfaces de Geradores
export interface CreateGeneratorRequest {
  ownerName: string;
  cpfCnpj: string;
  sourceType: SourceType;
  installedPower: number;
  concessionaire: string;
  ucNumber: string;
  city: string;
  state: string;
  status?: GeneratorStatus;
  observations?: string;
}

export interface Generator {
  id: string;
  ownerName: string;
  cpfCnpj: string;
  sourceType: SourceType;
  installedPower: number;
  concessionaire: string;
  ucNumber: string;
  city: string;
  state: string;
  status: GeneratorStatus;
  observations: string | null;
  createdAt: string;
  updatedAt: string;
  consumers: Consumer[];
}

// Interfaces de Comissões
export interface Commission {
  id: string;
  representativeId: string;
  consumerId: string;
  kwh: number;
  kwhPrice: number;
  commissionValue: number;
  status: CommissionStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  // Campos de comprovante de pagamento
  paymentProofUrl: string | null;
  paymentProofFileName: string | null;
  paymentProofUploadedAt: string | null;
  representative: {
    id: string;
    name: string;
    email: string;
  };
  consumer: {
    id: string;
    name: string;
    email: string;
    averageMonthlyConsumption?: number;
  };
}

export interface CreateCommissionRequest {
  representativeId: string;
  consumerId: string;
  kwh: number;
  kwhPrice: number;
}

export interface CommissionFilters {
  representativeId?: string;
  status?: CommissionStatus;
  startDate?: string;
  endDate?: string;
  minValue?: number;
  maxValue?: number;
}

// Interfaces de Configurações do Sistema
export interface KwhPriceHistory {
  id: string;
  price: number;
  previousPrice: number;
  changedBy: string;
  changedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface SystemSettings {
  currentKwhPrice: number;
  lastUpdated: string;
  updatedBy: string;
  history: KwhPriceHistory[];
}

export interface SystemStats {
  totalConsumers: number;
  totalRepresentatives: number;
  totalCommissions: number;
  totalCommissionsValue: number;
  currentKwhPrice: number;
  lastUpdated: string;
}

// Interfaces de Dashboard
export interface AdminDashboard {
  totalGenerators: number;
  totalConsumers: number;
  totalInstalledPower: number;
  totalMonthlyConsumption: number;
  allocationRate: number;
  summary?: {
    pendingConsumers?: number;
    pendingChangeRequests?: number;
  };
  notifications?: {
    pendingChangeRequests?: Array<{
      id: string;
      consumerName: string;
      representativeName: string;
      changedFields: string[];
      requestedAt: string;
    }>;
  };
  generatorsBySource: Array<{
    sourceType: SourceType;
    count: number;
    totalPower: number;
  }>;
  consumersByType: Array<{
    consumerType: ConsumerType;
    count: number;
    totalConsumption: number;
  }>;
  representatives?: {
    averageCommissionRate: number;
  };
}

export interface RepresentativeDashboard {
  stats: {
    totalConsumers: number;
    totalKwh: number;
    allocatedKwh: number;
    pendingKwh: number;
    allocationRate: number;
    estimatedMonthlySavings: number;
  };
  consumersByStatus: {
    allocated: {
      count: number;
      totalKwh: number;
      consumers: Consumer[];
    };
    inProcess: {
      count: number;
      totalKwh: number;
      consumers: Consumer[];
    };
    converted: {
      count: number;
      totalKwh: number;
      consumers: Consumer[];
    };
    available: {
      count: number;
      totalKwh: number;
      consumers: Consumer[];
    };
  };
  geographicDistribution: Array<{
    state: string;
    count: number;
    totalKwh: number;
  }>;
  monthlyEvolution: Array<{
    month: string;
    newConsumers: number;
    totalKwh: number;
  }>;
  recentActivity: Consumer[];
}

// Interfaces de Auditoria
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: any | null;
  newValues: any | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Estado da Aplicação
export interface AppState {
  currentView: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'representantes' | 'usuarios' | 'logs';
  isLoading: boolean;
  error: string | null;
}

export interface AppAction {
  type: 'SET_VIEW' | 'SET_LOADING' | 'SET_ERROR' | 'CLEAR_ERROR';
  payload?: any;
}
