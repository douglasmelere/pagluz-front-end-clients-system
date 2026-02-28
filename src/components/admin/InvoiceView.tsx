import { useState, useEffect } from 'react';
import { FileText, Download, Eye, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import DocumentPreviewModal from '../ui/DocumentPreviewModal';

interface InvoiceViewProps {
  consumerId?: string;
  invoiceUrl?: string; // Mantido para compatibilidade, mas não será usado
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://supabase-pagluz-backend-new.ztdny5.easypanel.host';

export default function InvoiceView({
  consumerId,
  invoiceUrl,
  invoiceFileName,
  invoiceUploadedAt,
  invoiceScannedData
}: InvoiceViewProps) {
  const { user } = useApp();
  const [errorLoadingInvoice, setErrorLoadingInvoice] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [invoiceBlobUrl, setInvoiceBlobUrl] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Verificar se há invoiceUrl válido
  const hasValidInvoiceUrl = !!(invoiceUrl && invoiceUrl.trim() !== '');

  // Função para obter o endpoint correto baseado no role do usuário
  const getInvoiceEndpoint = (): string | null => {
    if (!consumerId || !user) return null;

    const role = user.role;

    // Se for REPRESENTATIVE, usar endpoint de representante
    if (role === 'REPRESENTATIVE') {
      return `/consumers/representative/${consumerId}/invoice`;
    }

    // Para ADMIN, OPERATOR, SUPER_ADMIN, usar endpoint de admin
    return `/consumers/${consumerId}/invoice`;
  };

  // Limpar blob URL quando o componente desmontar
  useEffect(() => {
    return () => {
      if (invoiceBlobUrl) {
        URL.revokeObjectURL(invoiceBlobUrl);
      }
    };
  }, [invoiceBlobUrl]);

  const fetchInvoiceBlob = async (): Promise<string | null> => {
    const endpoint = getInvoiceEndpoint();
    if (!endpoint) {
      setErrorLoadingInvoice(true);
      return null;
    }

    setIsLoadingInvoice(true);
    setErrorLoadingInvoice(false);

    try {
      const token = localStorage.getItem('accessToken');
      const fullUrl = `${API_BASE_URL}${endpoint}`;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        // Tentar ler a mensagem de erro
        const contentType = response.headers.get('content-type');
        let errorMessage = 'Erro ao carregar fatura';

        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;

            // Verificar se é erro de bucket
            if (
              response.status === 404 &&
              (errorData.error === 'Bucket not found' ||
                errorData.message === 'Bucket not found' ||
                errorData.message?.includes('Bucket not found'))
            ) {
              setErrorLoadingInvoice(true);
              return null;
            }
          } catch {
            // Se não conseguir fazer parse, usar mensagem padrão
          }
        }

        throw new Error(errorMessage);
      }

      // Verificar se a resposta é um blob
      const contentType = response.headers.get('content-type');

      // Se a resposta é JSON, pode ser um erro
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.error === 'Bucket not found' || data.message === 'Bucket not found') {
          setErrorLoadingInvoice(true);
          return null;
        }
      }

      // Obter o blob
      const blob = await response.blob();

      // Criar URL temporária para o blob
      const blobUrl = URL.createObjectURL(blob);
      setInvoiceBlobUrl(blobUrl);
      return blobUrl;
    } catch (error: any) {
      setErrorLoadingInvoice(true);
      return null;
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const handleInvoiceClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (invoiceBlobUrl) {
      setIsPreviewModalOpen(true);
      return;
    }

    const blobUrl = await fetchInvoiceBlob();
    if (blobUrl) {
      setIsPreviewModalOpen(true);
    }
  };

  const handleDownloadClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    // Se já temos o blob URL, fazer download
    if (invoiceBlobUrl) {
      const link = document.createElement('a');
      link.href = invoiceBlobUrl;
      link.download = invoiceFileName || 'fatura.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Caso contrário, buscar o blob primeiro
    const blobUrl = await fetchInvoiceBlob();

    // Se obtivemos o blob URL, fazer download
    if (blobUrl) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = invoiceFileName || 'fatura.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!consumerId) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-medium font-display text-lg">Nenhuma fatura anexada</p>
        <p className="text-sm text-slate-500 mt-1 font-display">A fatura ainda não foi enviada pelo representante</p>
      </div>
    );
  }

  // Verificar se há invoiceUrl válido
  if (!hasValidInvoiceUrl) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-medium font-display text-lg">Nenhuma fatura anexada</p>
        <p className="text-sm text-slate-500 mt-1 font-display">Este consumidor não possui fatura cadastrada</p>
      </div>
    );
  }

  if (isLoadingInvoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Verificando Fatura</h3>
              <p className="text-sm text-slate-600">Verificando disponibilidade do arquivo...</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (errorLoadingInvoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Erro ao Carregar Fatura</h3>
              <p className="text-sm text-slate-600">Não foi possível acessar o arquivo da fatura</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-2">Erro: Bucket não encontrado</h4>
                <p className="text-sm text-red-700 mb-3">
                  O arquivo da fatura não está disponível. O backend retornou o seguinte erro:
                </p>
                <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                  <code className="text-xs text-red-800">
                    {`{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`}
                  </code>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  Possíveis causas:
                </p>
                <ul className="text-sm text-red-700 list-disc list-inside space-y-1 mb-3">
                  <li>O bucket de storage não foi configurado corretamente no backend</li>
                  <li>O arquivo foi movido ou excluído do storage</li>
                  <li>Há um problema de configuração no backend (Supabase Storage)</li>
                  <li>A URL da fatura está incorreta ou desatualizada</li>
                </ul>
                <p className="text-sm text-red-700 mb-3 font-medium">
                  ⚠️ Este é um problema de configuração do backend. Entre em contato com o administrador do sistema.
                </p>
                <button
                  onClick={() => {
                    setErrorLoadingInvoice(false);
                    // Recarregar a verificação
                    window.location.reload();
                  }}
                  className="text-sm px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Fatura Anexada</h3>
              <p className="text-sm text-slate-600">
                {invoiceFileName || 'Fatura do consumidor'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleInvoiceClick}
              disabled={errorLoadingInvoice || isLoadingInvoice}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              <span>{isLoadingInvoice ? 'Carregando...' : 'Ver Fatura'}</span>
            </button>
            <button
              onClick={handleDownloadClick}
              disabled={errorLoadingInvoice || isLoadingInvoice}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>Baixar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="p-6 space-y-6">
        {/* Data de Upload */}
        {invoiceUploadedAt && (
          <div className="flex items-center space-x-3 text-sm text-slate-600">
            <span className="font-medium">Upload em:</span>
            <span>{new Date(invoiceUploadedAt).toLocaleString('pt-BR')}</span>
          </div>
        )}

        {/* Dados Extraídos do OCR */}
        {invoiceScannedData && invoiceScannedData.extractedData && (
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h4 className="text-lg font-bold text-slate-900">Dados Extraídos (OCR)</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {invoiceScannedData.extractedData?.ucNumber && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Número da UC</p>
                  <p className="text-lg font-bold text-slate-900">{invoiceScannedData.extractedData.ucNumber}</p>
                </div>
              )}

              {invoiceScannedData.extractedData?.consumption !== undefined && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Consumo</p>
                  <p className="text-lg font-bold text-slate-900">
                    {invoiceScannedData.extractedData.consumption.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} kWh
                  </p>
                </div>
              )}

              {invoiceScannedData.extractedData?.value !== undefined && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Valor</p>
                  <p className="text-lg font-bold text-slate-900">
                    R$ {invoiceScannedData.extractedData.value.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
              )}

              {invoiceScannedData.extractedData?.dueDate && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Vencimento</p>
                  <p className="text-lg font-bold text-slate-900">{invoiceScannedData.extractedData.dueDate}</p>
                </div>
              )}
            </div>

            {/* Confiança do OCR */}
            {invoiceScannedData.confidence !== undefined && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  {invoiceScannedData.confidence >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-slate-700">Confiança do OCR:</span>
                </div>
                <span className={`text-sm font-bold ${invoiceScannedData.confidence >= 80 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                  {invoiceScannedData.confidence.toFixed(1)}%
                </span>
              </div>
            )}

            {/* Texto Completo Extraído */}
            {invoiceScannedData.text && (
              <div className="mt-4">
                <h5 className="text-sm font-semibold text-slate-700 mb-2">Texto Completo Extraído:</h5>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-48 overflow-y-auto">
                  <p className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                    {invoiceScannedData.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {(!invoiceScannedData || !invoiceScannedData.extractedData) && (
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Os dados da fatura ainda não foram processados pelo OCR.
              </p>
            </div>
          </div>
        )}
      </div>
      <DocumentPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        documentUrl={invoiceBlobUrl || ''}
        documentTitle={invoiceFileName || 'Fatura do consumidor'}
      />
    </div>
  );
}

