import { DocumentData, WebhookResponse, ContractData } from '../types/Contract';

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

export const fetchGeradores = async (_authData: any): Promise<GeradorData[]> => {
  const url = import.meta.env.VITE_GERADORES_WEBHOOK_URL || 'https://n8n.pagluz.com.br/webhook/047eb254-d124-40c8-991f-e109c7a4da09';

  if (!url) {
    throw new Error('URL do webhook de geradores não configurada. Verifique as variáveis de ambiente.');
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    throw error;
  }
};

export const saveGerador = async (
  geradorData: Partial<ContractData>,
  _authData: any
): Promise<WebhookResponse> => {
  const url = import.meta.env.VITE_SAVE_GERADOR_WEBHOOK_URL || 'https://n8n.pagluz.com.br/webhook/save-gerador';

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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  _authData: any
): Promise<WebhookResponse> => {
  const url = import.meta.env.VITE_WEBHOOK_URL || 'https://n8n.pagluz.com.br/webhook/e6e34398-975b-417f-882d-285d377b9659';

  // Sem autenticação básica

  if (!url) {
    return { success: false, message: 'URL do webhook não configurada. Verifique as variáveis de ambiente.' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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


