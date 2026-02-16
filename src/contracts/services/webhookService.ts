import { DocumentData, WebhookResponse, ContractData } from '../types/Contract';
import { authService } from '../../types/services/authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface GeradorData {
  id: number;
  nome: string;
  tipo_documento: 'cpf' | 'cnpj';
  cpf_cnpj: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email: string;
  banco: string;
  agencia: string;
  conta: string;
  created_at: string;
  updated_at: string;
}

const getAuthToken = (authData: any): string | null => {
  return authData?.token || authService.getStoredToken();
};

export const fetchGeradores = async (authData: any): Promise<GeradorData[]> => {
  const url = import.meta.env.VITE_GERADORES_WEBHOOK_URL || `${API_BASE_URL}/contracts/generators`;

  const token = getAuthToken(authData);

  if (!url) {
    throw new Error('URL do webhook de geradores não configurada. Verifique as variáveis de ambiente.');
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const saveGerador = async (
  geradorData: Partial<ContractData>,
  authData: any
): Promise<WebhookResponse> => {
  const url = import.meta.env.VITE_SAVE_GERADOR_WEBHOOK_URL || `${API_BASE_URL}/contracts/generators`;

  const token = getAuthToken(authData);
  if (!token) {
    return { success: false, message: 'Token não encontrado. Faça login novamente.' };
  }

  if (!url) {
    return { success: false, message: 'URL do webhook de salvamento não configurada.' };
  }

  try {
    const payload = {
      nome: geradorData.nomeGerador,
      tipo_documento: geradorData.tipoDocumentoGerador,
      cpf_cnpj: geradorData.cpfCnpjGerador,
      rua: geradorData.ruaGerador,
      numero: geradorData.numeroGerador,
      bairro: geradorData.bairroGerador,
      cidade: geradorData.cidadeGerador,
      uf: geradorData.ufGerador,
      cep: geradorData.cepGerador,
      email: geradorData.emailGerador,
      banco: geradorData.bancoGerador,
      agencia: geradorData.agenciaGerador,
      conta: geradorData.contaGerador,
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true, message: 'Gerador salvo com sucesso!' };
  } catch (error) {
    return { success: false, message: `Erro ao salvar gerador: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
  }
};

export const sendToWebhook = async (
  data: DocumentData,
  authData: any
): Promise<WebhookResponse> => {
  const url = import.meta.env.VITE_WEBHOOK_URL || `${API_BASE_URL}/contracts/generate`;

  const token = getAuthToken(authData);
  if (!token) {
    return { success: false, message: 'Token não encontrado. Faça login novamente.' };
  }

  if (!url) {
    return { success: false, message: 'URL do webhook não configurada. Verifique as variáveis de ambiente.' };
  }

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true, message: 'Documento gerado e enviado com sucesso! ✨' };
  } catch (error) {
    return { success: false, message: `Erro ao gerar documento: ${error instanceof Error ? error.message : 'Erro desconhecido'}` };
  }
};


