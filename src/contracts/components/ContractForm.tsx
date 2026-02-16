import React, { useState, useEffect } from 'react';
import { Header } from './Header.tsx';
import { ProgressBar } from './ProgressBar.tsx';
import { FormSection } from './FormSection.tsx';
import { FormField } from './FormField.tsx';
import { SelectField } from './SelectField.tsx';
import { LoadingSpinner } from './LoadingSpinner.tsx';
import { DocumentTypeSelector } from './DocumentTypeSelector.tsx';
import { ProcuracaoTypeSelector } from './ProcuracaoTypeSelector.tsx';
import { GeradorSelector } from './GeradorSelector.tsx';
import {
  DocumentData,
  DocumentType,
  ProcuracaoType,
  ContractData,
  ServiceContractData,
  ProcuracaoPJData,
  ProcuracaoPFData
} from '../types/Contract';
import { formatCpfCnpj, numberToWords, formatCep } from '../utils/formatters';
import { sendToWebhook, saveGerador, GeradorData } from '../services/webhookService';
import { CheckCircle, XCircle, User, Users, Zap, CreditCard, FileText, Eye, EyeOff, Sparkles, Building, Briefcase, LogOut } from 'lucide-react';

interface ContractFormProps {
  authData: any;
  onLogout: () => void;
}

export const ContractForm: React.FC<ContractFormProps> = ({ authData, onLogout }) => {
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [documentType, setDocumentType] = useState<DocumentType | null>(null);
  const [procuracaoType, setProcuracaoType] = useState<ProcuracaoType | null>(null);
  const [formData, setFormData] = useState<Partial<DocumentData>>({ cidade: '', data: getCurrentDate() });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  const [showGeradorSelector, setShowGeradorSelector] = useState(false);
  const [selectedGerador, setSelectedGerador] = useState<GeradorData | null>(null);
  const [saveGeradorAfterSubmit, setSaveGeradorAfterSubmit] = useState(false);

  useEffect(() => {
    if (documentType) {
      setFormData({ documentType, cidade: '', data: getCurrentDate() });
      setProcuracaoType(null);
      setCompletedSections(new Set());
      setSelectedGerador(null);
      setShowGeradorSelector(false);
    }
  }, [documentType]);

  useEffect(() => {
    if (documentType === 'locacao' && formData.documentType === 'locacao') {
      const data = formData as ContractData;
      const updates: Partial<ContractData> = {};
      const capExtenso = data.percentualCapacidade >= 0 ? numberToWords(data.percentualCapacidade) : '';
      const descExtenso = data.percentualDesconto >= 0 ? numberToWords(data.percentualDesconto) : '';
      const vigExtenso = data.prazoVigencia >= 0 ? numberToWords(data.prazoVigencia) : '';
      if (capExtenso !== data.percentualCapacidadePorExtenso) updates.percentualCapacidadePorExtenso = capExtenso;
      if (descExtenso !== data.percentualDescontoPorExtenso) updates.percentualDescontoPorExtenso = descExtenso;
      if (vigExtenso !== data.prazoVigenciaPorExtenso) updates.prazoVigenciaPorExtenso = vigExtenso;
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates } as ContractData));
      }
    }
  }, [formData, documentType]);

  const updateField = (field: string) => (value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string'
        ? (field.toLowerCase().includes('cpf') || field.toLowerCase().includes('cnpj'))
          ? formatCpfCnpj(value)
          : field.toLowerCase().includes('cep')
            ? formatCep(value)
            : value
        : value
    }));
  };

  const updateTipoDocumentoGerador = (value: string) => {
    const normalizedValue = value.toLowerCase();
    setFormData(prev => ({ ...prev, tipoDocumentoGerador: normalizedValue as 'cpf' | 'cnpj' }));
  };

  const handleGeradorSelect = (gerador: GeradorData) => {
    setSelectedGerador(gerador);
    setShowGeradorSelector(false);
    if (documentType === 'locacao') {
      const normalizedTipoDocumento = (
        gerador.tipo_documento || (gerador as any).tipoDocumento || ''
      )
        .toString()
        .toLowerCase();

      const cpfCnpj =
        gerador.cpf_cnpj ||
        (gerador as any).cpfCnpj ||
        (gerador as any).cpf_cnpj ||
        '';

      const numeroUc =
        (gerador as any).numero_uc ||
        (gerador as any).numeroUc ||
        (gerador as any).numeroUcGerador ||
        '';

      const numeroEndereco =
        (gerador as any).numero || (gerador as any).numero_casa || gerador.numero;
      setFormData(prev => ({
        ...prev,
        documentType: 'locacao',
        nomeGerador: gerador.nome,
        tipoDocumentoGerador: normalizedTipoDocumento as 'cpf' | 'cnpj',
        cpfCnpjGerador: cpfCnpj,
        ruaGerador: gerador.rua,
        numeroGerador: numeroEndereco,
        bairroGerador: gerador.bairro,
        cidadeGerador: gerador.cidade,
        ufGerador: gerador.uf,
        cepGerador: gerador.cep,
        emailGerador: gerador.email,
        bancoGerador: gerador.banco,
        agenciaGerador: gerador.agencia,
        contaGerador: gerador.conta,
        numeroUcGerador: numeroUc,
      }));
    }
  };

  const handleNewGerador = () => {
    setSelectedGerador(null);
    setShowGeradorSelector(false);
  };

  const tiposUsina = [
    { value: 'solar', label: 'Solar Fotovoltaica' },
    { value: 'eolica', label: 'Eólica' },
    { value: 'hidrica', label: 'Hídrica (PCH)' },
    { value: 'biomassa', label: 'Biomassa' },
    { value: 'biogas', label: 'Biogás' },
    { value: 'hibrida', label: 'Híbrida (Solar + Eólica)' }
  ];

  const tiposServico = [
    { value: 'energia-solar-fotovoltaica', label: 'Energia Solar Fotovoltaica' },
    { value: 'energia-eolica', label: 'Energia Eólica' },
    { value: 'energia-hidrica', label: 'Energia Hídrica (PCH)' },
    { value: 'energia-biomassa', label: 'Energia de Biomassa' },
    { value: 'energia-biogas', label: 'Energia de Biogás' },
    { value: 'consultoria-energetica', label: 'Consultoria Energética' },
    { value: 'manutencao-usinas', label: 'Manutenção de Usinas' },
    { value: 'monitoramento-geracao', label: 'Monitoramento de Geração' },
    { value: 'gestao-creditos', label: 'Gestão de Créditos de Energia' }
  ];

  const ufs = [
    { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' }, { value: 'AP', label: 'Amapá' }, { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' }, { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' }, { value: 'MA', label: 'Maranhão' }, { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' }, { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' }, { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' }, { value: 'RO', label: 'Rondônia' }, { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' }, { value: 'TO', label: 'Tocantins' }
  ];

  const getTotalSteps = (): number => {
    if (documentType === 'locacao') return 5;
    if (documentType === 'prestacao') return 4;
    if (documentType === 'procuracao') return 3;
    return 0;
  };

  const validateForm = (): boolean => {
    if (!documentType) return false;
    if (!formData.cidade || !formData.data) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setMessage({ type: 'error', text: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await sendToWebhook(formData as DocumentData, authData);
      if (response.success && saveGeradorAfterSubmit && documentType === 'locacao') {
        const saveResponse = await saveGerador(formData as ContractData, authData);
        setMessage({ type: 'success', text: `${response.message} ${saveResponse.success ? 'Gerador também foi salvo!' : 'Aviso: Gerador não foi salvo.'}` });
      } else {
        setMessage({ type: response.success ? 'success' : 'error', text: response.message });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: `Erro ao processar: ${error?.message || 'Erro desconhecido'}` });
    }
    setIsLoading(false);
  };

  const renderLocacaoForm = () => {
    const data = formData as ContractData;
    return (
      <>
        <FormSection title="Dados do Gerador" description="Informações da pessoa/empresa que aluga a capacidade de geração" icon={<User className="h-6 w-6" />}>
          {!showGeradorSelector && (
            <div className="mb-6 p-4 bg-slate-50/50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1 font-display">{selectedGerador ? 'Gerador Selecionado' : 'Selecionar Gerador'}</h4>
                  {selectedGerador ? (
                    <p className="text-sm text-slate-500 font-medium">{selectedGerador.nome} - {selectedGerador.cpf_cnpj}</p>
                  ) : (
                    <p className="text-sm text-slate-500 font-medium">Escolha um gerador existente ou crie um novo</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowGeradorSelector(true)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors duration-200 font-medium shadow-sm">{selectedGerador ? 'Alterar' : 'Selecionar'}</button>
                  {selectedGerador && (
                    <button type="button" onClick={handleNewGerador} className="px-4 py-2 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium shadow-md">Novo</button>
                  )}
                </div>
              </div>
            </div>
          )}
          {showGeradorSelector && (
            <div className="mb-6">
              <GeradorSelector authData={authData} onGeradorSelect={handleGeradorSelect} onNewGerador={handleNewGerador} />
            </div>
          )}
          <FormField label="Nome do Gerador" name="nomeGerador" value={data.nomeGerador || ''} onChange={updateField('nomeGerador')} required />
          <SelectField label="Tipo de Documento" name="tipoDocumentoGerador" value={(data.tipoDocumentoGerador || '').toLowerCase()} onChange={updateTipoDocumentoGerador} options={[{ value: 'cpf', label: 'CPF (Pessoa Física)' }, { value: 'cnpj', label: 'CNPJ (Pessoa Jurídica)' }]} placeholder="Selecione o tipo" required />
          <FormField label={((data.tipoDocumentoGerador || '').toLowerCase() === 'cpf') ? 'CPF do Gerador' : ((data.tipoDocumentoGerador || '').toLowerCase() === 'cnpj') ? 'CNPJ do Gerador' : 'CPF/CNPJ do Gerador'} name="cpfCnpjGerador" value={data.cpfCnpjGerador || ''} onChange={updateField('cpfCnpjGerador')} placeholder={((data.tipoDocumentoGerador || '').toLowerCase() === 'cpf') ? '000.000.000-00' : ((data.tipoDocumentoGerador || '').toLowerCase() === 'cnpj') ? '00.000.000/0000-00' : 'CPF ou CNPJ'} required />
          <FormField label="Rua/Avenida" name="ruaGerador" value={data.ruaGerador || ''} onChange={updateField('ruaGerador')} placeholder="Ex: Rua das Flores" required />
          <FormField label="Número" name="numeroGerador" value={data.numeroGerador || ''} onChange={updateField('numeroGerador')} placeholder="Ex: 123" required />
          <FormField label="Bairro" name="bairroGerador" value={data.bairroGerador || ''} onChange={updateField('bairroGerador')} placeholder="Ex: Centro" required />
          <FormField label="Cidade" name="cidadeGerador" value={data.cidadeGerador || ''} onChange={updateField('cidadeGerador')} placeholder="Ex: São Paulo" required />
          <SelectField label="Estado (UF)" name="ufGerador" value={data.ufGerador || ''} onChange={updateField('ufGerador')} options={ufs} required />
          <FormField label="CEP" name="cepGerador" value={data.cepGerador || ''} onChange={updateField('cepGerador')} placeholder="00000-000" required />
          <FormField label="E-mail do Gerador" name="emailGerador" type="email" value={data.emailGerador || ''} onChange={updateField('emailGerador')} required />
        </FormSection>

        <FormSection title="Dados Bancários do Gerador" description="Informações bancárias para recebimento dos pagamentos" icon={<CreditCard className="h-6 w-6" />}>
          <FormField label="Banco" name="bancoGerador" value={data.bancoGerador || ''} onChange={updateField('bancoGerador')} required />
          <FormField label="Agência" name="agenciaGerador" value={data.agenciaGerador || ''} onChange={updateField('agenciaGerador')} required />
          <FormField label="Número da Conta" name="contaGerador" value={data.contaGerador || ''} onChange={updateField('contaGerador')} required />
          {!selectedGerador && (
            <div className="md:col-span-2 mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <label className="flex items-center cursor-pointer"><input type="checkbox" checked={saveGeradorAfterSubmit} onChange={(e) => setSaveGeradorAfterSubmit(e.target.checked)} className="h-4 w-4 text-accent focus:ring-accent border-slate-300 rounded" /><span className="ml-3 text-sm text-blue-700 font-medium">Salvar dados deste gerador para uso futuro</span></label>
              <p className="mt-2 text-xs text-blue-500 font-medium">Os dados do gerador serão salvos e poderão ser selecionados automaticamente em futuros contratos.</p>
            </div>
          )}
        </FormSection>

        <FormSection title="Dados do Consumidor" description="Informações da pessoa/empresa que aluga a capacidade" icon={<Users className="h-6 w-6" />}>
          <FormField label="Nome do Consumidor" name="nomeConsumidor" value={data.nomeConsumidor || ''} onChange={updateField('nomeConsumidor')} required />
          <SelectField label="Tipo de Documento" name="tipoDocumentoConsumidor" value={data.tipoDocumentoConsumidor || ''} onChange={updateField('tipoDocumentoConsumidor')} options={[{ value: 'cpf', label: 'CPF (Pessoa Física)' }, { value: 'cnpj', label: 'CNPJ (Pessoa Jurídica)' }]} placeholder="Selecione o tipo" required />
          <FormField label={data.tipoDocumentoConsumidor === 'cpf' ? 'CPF do Consumidor' : data.tipoDocumentoConsumidor === 'cnpj' ? 'CNPJ do Consumidor' : 'CPF/CNPJ do Consumidor'} name="cpfCnpjConsumidor" value={data.cpfCnpjConsumidor || ''} onChange={updateField('cpfCnpjConsumidor')} placeholder={data.tipoDocumentoConsumidor === 'cpf' ? '000.000.000-00' : data.tipoDocumentoConsumidor === 'cnpj' ? '00.000.000/0000-00' : 'CPF ou CNPJ'} required />
          <FormField label="Rua/Avenida" name="ruaConsumidor" value={data.ruaConsumidor || ''} onChange={updateField('ruaConsumidor')} placeholder="Ex: Rua das Flores" required />
          <FormField label="Número" name="numeroConsumidor" value={data.numeroConsumidor || ''} onChange={updateField('numeroConsumidor')} placeholder="Ex: 123" required />
          <FormField label="Bairro" name="bairroConsumidor" value={data.bairroConsumidor || ''} onChange={updateField('bairroConsumidor')} placeholder="Ex: Centro" required />
          <FormField label="Cidade" name="cidadeConsumidor" value={data.cidadeConsumidor || ''} onChange={updateField('cidadeConsumidor')} placeholder="Ex: São Paulo" required />
          <SelectField label="Estado (UF)" name="ufConsumidor" value={data.ufConsumidor || ''} onChange={updateField('ufConsumidor')} options={ufs} required />
          <FormField label="CEP" name="cepConsumidor" value={data.cepConsumidor || ''} onChange={updateField('cepConsumidor')} placeholder="00000-000" required />
          <FormField label="E-mail do Consumidor" name="emailConsumidor" type="email" value={data.emailConsumidor || ''} onChange={updateField('emailConsumidor')} required />
        </FormSection>

        <FormSection title="Dados da Usina/Contrato" description="Informações sobre a usina e condições do contrato" icon={<Zap className="h-6 w-6" />}>
          <SelectField label="Tipo da Usina" name="tipoUsina" value={data.tipoUsina || ''} onChange={updateField('tipoUsina')} options={tiposUsina} placeholder="Selecione o tipo de usina" required />
          <FormField label="Número da UC do Gerador" name="numeroUcGerador" value={data.numeroUcGerador || ''} onChange={updateField('numeroUcGerador')} required />
          <FormField label="Número da UC do Consumidor" name="numeroUcConsumidor" value={data.numeroUcConsumidor || ''} onChange={updateField('numeroUcConsumidor')} required />
          <FormField label="Percentual da Capacidade (%)" name="percentualCapacidade" type="number" value={data.percentualCapacidade || 0} onChange={updateField('percentualCapacidade')} required />
          <FormField label="Percentual da Capacidade (por extenso)" name="percentualCapacidadePorExtenso" value={data.percentualCapacidadePorExtenso || ''} onChange={updateField('percentualCapacidadePorExtenso')} disabled />
          <FormField label="Percentual de Desconto (%)" name="percentualDesconto" type="number" value={data.percentualDesconto || 0} onChange={updateField('percentualDesconto')} required />
          <FormField label="Percentual de Desconto (por extenso)" name="percentualDescontoPorExtenso" value={data.percentualDescontoPorExtenso || ''} onChange={updateField('percentualDescontoPorExtenso')} disabled />
          <FormField label="Dia do mês para pagamento" name="diaPagamento" type="number" value={data.diaPagamento || 1} onChange={updateField('diaPagamento')} required />
          <FormField label="Prazo de Vigência (meses)" name="prazoVigencia" type="number" value={data.prazoVigencia || 12} onChange={updateField('prazoVigencia')} required />
          <FormField label="Prazo de Vigência (por extenso)" name="prazoVigenciaPorExtenso" value={data.prazoVigenciaPorExtenso || ''} onChange={updateField('prazoVigenciaPorExtenso')} disabled />
          <FormField label="Prazo para multa em caso de rescisão antecipada (meses)" name="prazoMulta" type="number" value={data.prazoMulta || 12} onChange={updateField('prazoMulta')} required />
        </FormSection>
      </>
    );
  };

  const renderPrestacaoForm = () => {
    const data = formData as ServiceContractData;
    return (
      <>
        <FormSection title="Dados do Contratante" description="Informações da pessoa/empresa contratante" icon={<User className="h-6 w-6" />}>
          <FormField label="Nome do Contratante" name="nomeContratante" value={data.nomeContratante || ''} onChange={updateField('nomeContratante')} required />
          <FormField label="CPF/CNPJ do Contratante" name="cpfCnpjContratante" value={data.cpfCnpjContratante || ''} onChange={updateField('cpfCnpjContratante')} required />
          <FormField label="Endereço Completo (sede/morada)" name="enderecoContratante" value={data.enderecoContratante || ''} onChange={updateField('enderecoContratante')} className="md:col-span-2" required />
          <FormField label="E-mail do Contratante" name="emailContratante" type="email" value={data.emailContratante || ''} onChange={updateField('emailContratante')} required />
          <FormField label="Nome do Representante do Contratante" name="nomeRepresentanteContratante" value={data.nomeRepresentanteContratante || ''} onChange={updateField('nomeRepresentanteContratante')} required />
          <FormField label="CPF do Representante do Contratante" name="cpfRepresentanteContratante" value={data.cpfRepresentanteContratante || ''} onChange={updateField('cpfRepresentanteContratante')} required />
        </FormSection>

        <FormSection title="Dados da Contratada" description="Informações da PagLuz (dados fixos)" icon={<Building className="h-6 w-6" />}>
          <div className="md:col-span-2 bg-slate-50/50 p-6 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-4 font-display">Dados Fixos da Contratada:</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Nome:</strong> PagLuz</p>
              <p><strong>CNPJ:</strong> 57.087.593/0001-92</p>
              <p><strong>Endereço:</strong> Rua Av. Frei João, Nº 601, São Francisco, Luzerna - SC</p>
              <p><strong>E-mail:</strong> contato.pagluz@gmail.com</p>
              <p><strong>Representante:</strong> Eduardo Trevisan</p>
              <p><strong>CPF do Representante:</strong> 116.091.029-40</p>
              <p><strong>Conta Bancária:</strong> Banco 3033 – Conta Corrente: 32.155-9</p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Dados Operacionais" description="Informações sobre o serviço e condições" icon={<Briefcase className="h-6 w-6" />}>
          <SelectField label="Tipo de Energia ou Nome do Serviço" name="tipoEnergia" value={data.tipoEnergia || ''} onChange={updateField('tipoEnergia')} options={tiposServico} placeholder="Selecione o tipo de serviço" required />
          <FormField label="E-mail para comunicações" name="emailComunicacoes" type="email" value={data.emailComunicacoes || ''} onChange={updateField('emailComunicacoes')} required />
          <FormField label="Prazo mínimo para multa rescisória (meses)" name="prazoMinimoMulta" type="number" value={data.prazoMinimoMulta || 12} onChange={updateField('prazoMinimoMulta')} required />
        </FormSection>
      </>
    );
  };

  const renderProcuracaoPJForm = () => {
    const data = formData as ProcuracaoPJData;
    return (
      <>
        <FormSection title="Dados da Empresa Outorgante" description="Informações da empresa que outorga a procuração" icon={<Building className="h-6 w-6" />}>
          <FormField label="Razão Social da empresa" name="razaoSocialOutorgante" value={data.razaoSocialOutorgante || ''} onChange={updateField('razaoSocialOutorgante')} placeholder="Ex: Comércio Walter e Eliane LTDA" required />
          <FormField label="CNPJ da empresa" name="cnpjOutorgante" value={data.cnpjOutorgante || ''} onChange={updateField('cnpjOutorgante')} placeholder="00.000.000/0000-00" required />
          <FormField label="Endereço Completo da Empresa" name="enderecoOutorgante" value={data.enderecoOutorgante || ''} onChange={updateField('enderecoOutorgante')} placeholder="Ex: Rua das Flores, nº 123, Centro, São Paulo - SP, CEP: 01234-567" className="md:col-span-2" required />
        </FormSection>
        <FormSection title="Dados do Representante Legal" description="Informações da pessoa que representa a empresa" icon={<User className="h-6 w-6" />}>
          <FormField label="Cargo do representante" name="cargoRepresentanteOutorgante" value={data.cargoRepresentanteOutorgante || ''} onChange={updateField('cargoRepresentanteOutorgante')} placeholder="Ex: Sócio-administrador, Diretor, etc." required />
          <FormField label="Nome completo do representante" name="nomeRepresentanteOutorgante" value={data.nomeRepresentanteOutorgante || ''} onChange={updateField('nomeRepresentanteOutorgante')} required />
          <FormField label="CPF do representante" name="cpfRepresentanteOutorgante" value={data.cpfRepresentanteOutorgante || ''} onChange={updateField('cpfRepresentanteOutorgante')} placeholder="000.000.000-00" required />
        </FormSection>
      </>
    );
  };

  const renderProcuracaoPFForm = () => {
    const data = formData as ProcuracaoPFData;
    return (
      <>
        <FormSection title="Dados do Outorgante" description="Informações da pessoa física que outorga a procuração" icon={<User className="h-6 w-6" />}>
          <FormField label="Nome completo do outorgante" name="nomeOutorgante" value={data.nomeOutorgante || ''} onChange={updateField('nomeOutorgante')} required />
          <FormField label="CPF do outorgante" name="cpfOutorgante" value={data.cpfOutorgante || ''} onChange={updateField('cpfOutorgante')} placeholder="000.000.000-00" required />
          <FormField label="Ocupação/Profissão" name="ocupacaoOutorgante" value={data.ocupacaoOutorgante || ''} onChange={updateField('ocupacaoOutorgante')} placeholder="Ex: Empresário, Aposentado, etc." required />
          <FormField label="Endereço Completo" name="enderecoOutorgante" value={data.enderecoOutorgante || ''} onChange={updateField('enderecoOutorgante')} placeholder="Ex: Rua das Flores, nº 123, Centro, São Paulo - SP, CEP: 01234-567" className="md:col-span-2" required />
        </FormSection>
      </>
    );
  };

  if (!documentType) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <DocumentTypeSelector selectedType={documentType} onTypeSelect={setDocumentType} />
        </div>
      </div>
    );
  }

  if (documentType === 'procuracao' && !procuracaoType) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <button onClick={() => setDocumentType(null)} className="mb-6 px-4 py-2 text-slate-500 hover:text-slate-900 font-medium flex items-center transition-colors"><span className="mr-2">←</span> Voltar para seleção de documento</button>
          <ProcuracaoTypeSelector selectedType={procuracaoType} onTypeSelect={(type: ProcuracaoType) => { setProcuracaoType(type); setFormData(prev => ({ ...prev, procuracaoType: type })); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => { if (documentType === 'procuracao' && procuracaoType) { setProcuracaoType(null); } else { setDocumentType(null); } }} className="mb-6 px-4 py-2 text-slate-500 hover:text-slate-900 font-medium flex items-center transition-colors"><span className="mr-2">←</span> Voltar</button>
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <button onClick={onLogout} className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors duration-200 flex items-center font-medium shadow-sm border border-transparent hover:border-red-100">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </button>
        </div>
        <ProgressBar currentStep={completedSections.size} totalSteps={getTotalSteps()} />
        <form onSubmit={handleSubmit} className="space-y-6">
          {documentType === 'locacao' && renderLocacaoForm()}
          {documentType === 'prestacao' && renderPrestacaoForm()}
          {documentType === 'procuracao' && procuracaoType === 'pj' && renderProcuracaoPJForm()}
          {documentType === 'procuracao' && procuracaoType === 'pf' && renderProcuracaoPFForm()}
          <FormSection title="Dados para Fechamento" description="Informações de local e data para assinatura" icon={<FileText className="h-6 w-6" />}>
            <FormField label="Cidade da assinatura" name="cidade" value={formData.cidade || ''} onChange={updateField('cidade')} placeholder="Ex: Luzerna" required />
            <FormField label="Data da assinatura" name="data" type="date" value={formData.data || getCurrentDate()} onChange={updateField('data')} required />
          </FormSection>
          {message && (
            <div className={`rounded-xl p-6 flex items-center shadow-sm border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              {message.type === 'success' ? (<CheckCircle className="h-6 w-6 text-emerald-600 mr-4" />) : (<XCircle className="h-6 w-6 text-red-600 mr-4" />)}
              <span className={`font-medium ${message.type === 'success' ? 'text-emerald-800' : 'text-red-800'}`}>{message.text}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex-1 px-8 py-4 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-semibold flex items-center justify-center shadow-sm">
              {showPreview ? (<><EyeOff className="h-5 w-5 mr-2" />Ocultar Dados</>) : (<><Eye className="h-5 w-5 mr-2" />Visualizar Dados</>)}
            </button>
            <button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-accent to-accent-secondary text-white px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200 font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md">
              {isLoading ? (<LoadingSpinner />) : (<><Sparkles className="h-5 w-5 mr-2" />Gerar Documento</>)}
            </button>
          </div>
          {showPreview && (
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8">
              <h3 className="text-xl font-bold font-display text-slate-900 mb-6 flex items-center"><Eye className="h-6 w-6 mr-3 text-accent" />Preview dos Dados do Documento</h3>
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                <pre className="text-sm text-slate-600 whitespace-pre-wrap overflow-auto font-mono">{JSON.stringify(formData, null, 2)}</pre>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};


