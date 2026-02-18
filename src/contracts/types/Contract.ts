export type DocumentType = 'locacao' | 'prestacao' | 'procuracao';
export type ProcuracaoType = 'pf' | 'pj';

export interface WebhookResponse {
  success: boolean;
  message: string;
}

export interface DocumentData {
  documentType: DocumentType;
  cidade: string;
  data: string;
  [key: string]: any;
}

export interface ContractData extends DocumentData {
  nomeGerador: string;
  tipoDocumentoGerador: 'cpf' | 'cnpj';
  cpfCnpjGerador: string;
  ruaGerador: string;
  numeroGerador: string;
  bairroGerador: string;
  cidadeGerador: string;
  ufGerador: string;
  cepGerador: string;
  emailGerador: string;
  bancoGerador: string;
  agenciaGerador: string;
  contaGerador: string;
  nomeConsumidor: string;
  tipoDocumentoConsumidor: 'cpf' | 'cnpj';
  cpfCnpjConsumidor: string;
  ruaConsumidor: string;
  numeroConsumidor: string;
  bairroConsumidor: string;
  cidadeConsumidor: string;
  ufConsumidor: string;
  cepConsumidor: string;
  emailConsumidor: string;
  tipoUsina: string;
  numeroUcGerador: string;
  numeroUcConsumidor: string;
  percentualCapacidade: number;
  percentualCapacidadePorExtenso?: string;
  percentualDesconto: number;
  percentualDescontoPorExtenso?: string;
  diaPagamento: number;
  prazoVigencia: number;
  prazoVigenciaPorExtenso?: string;
  prazoMulta: number;
}

export interface ServiceContractData extends DocumentData {
  nomeContratante: string;
  cpfCnpjContratante: string;
  enderecoContratante: string;
  emailContratante: string;
  nomeRepresentanteContratante: string;
  cpfRepresentanteContratante: string;
  tipoEnergia: string;
  emailComunicacoes: string;
  prazoMulta: number;
}

export interface ProcuracaoPJData extends DocumentData {
  razaoSocialOutorgante: string;
  cnpjOutorgante: string;
  enderecoOutorgante: string;
  cargoRepresentanteOutorgante: string;
  nomeRepresentanteOutorgante: string;
  cpfRepresentanteOutorgante: string;
}

export interface ProcuracaoPFData extends DocumentData {
  nomeOutorgante: string;
  cpfOutorgante: string;
  ocupacaoOutorgante: string;
  enderecoOutorgante: string;
}


