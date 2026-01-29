import { authService } from '../../types/services/authService';

export type Generator = {
  id: string;
  nome: string;
  cpfCnpj: string;
  tipoDocumento?: 'cpf' | 'cnpj';
  email: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  banco: string;
  agencia: string;
  conta: string;
  numeroUcGerador: string;
  tipoUsina: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function fetchGenerators(token?: string): Promise<Generator[]> {
  const authToken = token || authService.getStoredToken();
  if (!authToken) {
    throw new Error('Token não encontrado');
  }
  const res = await fetch(`${API_BASE_URL}/contracts/generators`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  if (!res.ok) throw new Error('Erro ao buscar geradores');
  const data = await res.json();
  
  console.log('🔍 Dados brutos da API:', JSON.stringify(data, null, 2));
  
  // Mapear snake_case para camelCase
  const mapped = data.map((item: any) => {
    const result = {
      id: item.id,
      nome: item.nome,
      cpfCnpj: item.cpf_cnpj || item.cpfCnpj,
      tipoDocumento: (item.tipo_documento || item.tipoDocumento)?.toLowerCase() as 'cpf' | 'cnpj',
      email: item.email,
      rua: item.rua,
      numero: item.numero_casa || item.numero,
      bairro: item.bairro,
      cidade: item.cidade,
      uf: item.uf,
      cep: item.cep,
      banco: item.banco,
      agencia: item.agencia,
      conta: item.conta,
      numeroUcGerador: item.numero_uc || item.numeroUcGerador || '',
      tipoUsina: item.tipo_usina || item.tipoUsina || '',
    };
    console.log('🔄 Item original:', item);
    console.log('🔄 Item mapeado:', result);
    return result;
  });
  
  console.log('✅ Dados mapeados completos:', JSON.stringify(mapped, null, 2));
  return mapped;
}

export async function generateContract(payload: any, token?: string) {
  const authToken = token || authService.getStoredToken();
  if (!authToken) {
    throw new Error('Token não encontrado no storage');
  }
  
  // Debug: Verificar o payload antes de enviar
  console.log('🔍 Payload sendo enviado:', payload);
  console.log('📋 prazoMulta no payload:', payload.prazoMulta, 'tipo:', typeof payload.prazoMulta);
  
  const res = await fetch(`${API_BASE_URL}/contracts/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erro ao gerar contrato');
  return res.json();
}
