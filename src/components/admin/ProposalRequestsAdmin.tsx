import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../types/services/api';
import { ProposalRequest } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, FileText, CheckCircle, Clock, XCircle, AlertCircle, X, Eye, Upload, Trash2, FileSignature } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import DocumentPreviewModal from '../ui/DocumentPreviewModal';
import Toast from '../common/Toast';

export default function ProposalRequestsAdmin() {
  const [requests, setRequests] = useState<ProposalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ProposalRequest | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [requestToGenerateId, setRequestToGenerateId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/proposal-requests');
      setRequests(data || []);
    } catch (err) {
      setError('Erro ao carregar as solicitações de propostas.');
      toast.showError('Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const triggerFileInput = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRequestToGenerateId(id);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !requestToGenerateId) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.patch(`/proposal-requests/${requestToGenerateId}/generate`, formData);
      toast.showSuccess('Proposta gerada e arquivo enviado com sucesso!');
      fetchRequests();
      setSelectedRequest(null);
    } catch (err) {
      toast.showError('Erro ao enviar o arquivo da proposta.');
    } finally {
      setRequestToGenerateId(null);
    }
  };

  const handleDeleteRequest = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!window.confirm("Você tem certeza que deseja excluir esta solicitação? Essa ação não pode ser desfeita.")) return;

    try {
      await api.delete(`/proposal-requests/${id}`);
      toast.showSuccess('Solicitação excluída com sucesso!');
      fetchRequests();
      if (selectedRequest?.id === id) {
        setSelectedRequest(null);
      }
    } catch (err) {
      toast.showError('Erro ao excluir a solicitação.');
    }
  };

  const handleViewDocument = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token não encontrado');

      const response = await fetch(`${api.baseURL}/proposal-requests/${id}/document`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        let errorMsg = 'Erro ao baixar documento';
        try {
          const errData = await response.json();
          if (errData.message) {
            errorMsg = Array.isArray(errData.message) ? errData.message.join(', ') : errData.message;
          }
        } catch (e) { }
        throw new Error(errorMsg);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err: any) {
      toast.showError(err.message || 'Não foi possível carregar o documento anexado.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-center">
        <div>
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={fetchRequests}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-secondary transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-xl text-accent">
              <FileText className="h-6 w-6" />
            </div>
            Solicitações de Propostas
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as solicitações de propostas dos representantes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRequests}
            className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Tabela de Solicitações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-display font-medium text-slate-900 mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-slate-500">Ainda não receberam solicitações de propostas dos representantes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase">Cliente</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase">Tipo</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase">Representante</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase">Data da Solicitação</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase">Status</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-700 tracking-wide uppercase text-right">Ação</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-display font-medium text-slate-900">{request.clientName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">ID: {request.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700">
                        {request.consumerType === 'RESIDENTIAL' ? 'Residencial' :
                         request.consumerType === 'COMMERCIAL' ? 'Comercial' :
                         request.consumerType === 'INDUSTRIAL' ? 'Industrial' :
                         request.consumerType === 'RURAL' ? 'Rural' :
                         request.consumerType === 'PUBLIC_POWER' ? 'Poder Público' :
                         request.consumerType || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-900">{request.representative.name}</div>
                      <div className="text-xs text-slate-500">{request.representative.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">
                        {format(new Date(request.createdAt), "dd 'de' MMM, yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      ) : request.status === 'GENERATED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3.5 h-3.5" /> Gerada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3.5 h-3.5" /> {request.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          onClick={() => setSelectedRequest(request as any)}
                          className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {request.status === 'PENDING' ? (
                          <button
                            onClick={(e) => triggerFileInput(request.id, e)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Upload className="w-4 h-4" />
                            Anexar e Gerar
                          </button>
                        ) : request.status === 'GENERATED' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleViewDocument(request.id, e)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium transition-colors"
                            >
                              <FileSignature className="w-4 h-4 text-accent" />
                              Ver Proposta
                            </button>
                            <button
                              onClick={(e) => triggerFileInput(request.id, e)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium transition-colors"
                              title="Substituir Arquivo"
                            >
                              <Upload className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteRequest(request.id, e)}
                              className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-sm font-medium transition-colors"
                              title="Excluir Solicitação"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Solicitação */}
      {selectedRequest && createPortal(
        <>
          <div className="fixed inset-0 z-[5000] bg-slate-900/60 backdrop-blur-[2px] animate-fade-in" onClick={() => setSelectedRequest(null)} />
          <div className="fixed inset-0 z-[5001] flex items-center justify-center p-4 sm:p-6">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-scale-up">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="h-5 w-5 text-accent" />
                  Detalhes da Solicitação
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="block text-sm font-medium text-slate-500 mb-1">Cliente Solicitante</span>
                      <span className="block text-base font-display font-semibold text-slate-900">{selectedRequest.clientName}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-slate-500 mb-1">Representante Vinculado</span>
                      <span className="block text-base font-display font-semibold text-slate-900">{selectedRequest.representative?.name}</span>
                      <span className="block text-sm text-slate-500">{selectedRequest.representative?.email}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mt-6">
                    <h4 className="text-sm font-display font-semibold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-slate-400" />
                      Dados do Formulário da Proposta
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                      {Object.entries(selectedRequest).map(([key, value]) => {
                        if (['id', 'clientName', 'representative', 'status', 'createdAt', 'updatedAt', 'fileUrl', 'proposalUrl', 'documentUrl', 'proposalFileUrl'].includes(key)) return null;
                        if (typeof value === 'object' && value !== null) return null;
                        if (value === null || value === undefined || value === '') return null;

                        const keyTranslations: Record<string, string> = {
                          representativeId: 'ID do Representante',
                          invoiceAmount: 'Valor da Fatura (R$)',
                          phaseType: 'Tipo de Fase',
                          kwhValue: 'Valor kWh',
                          phone: 'Telefone',
                          email: 'E-mail',
                          averageConsumption: 'Consumo Médio (kWh)',
                          discount: 'Desconto',
                          state: 'UF',
                          city: 'Cidade',
                          street: 'Rua',
                          number: 'Número',
                          neighborhood: 'Bairro',
                          zipCode: 'CEP',
                          ucNumber: 'Nº UC',
                          concessionaire: 'Concessionária',
                          consumerType: 'Tipo Consumidor',
                          phase: 'Fase',
                          notes: 'Observações',
                          documentType: 'Tipo de Documento',
                          cpfCnpj: 'CPF/CNPJ',
                          discountOffered: 'Desconto Oferecido (%)'
                        };

                        const valueTranslations: Record<string, string> = {
                          MONOPHASIC: 'Monofásico',
                          BIPHASIC: 'Bifásico',
                          TRIPHASIC: 'Trifásico',
                          RESIDENTIAL: 'Residencial',
                          COMMERCIAL: 'Comercial',
                          INDUSTRIAL: 'Industrial',
                          RURAL: 'Rural',
                          PUBLIC_POWER: 'Poder Público'
                        };

                        const formatKey = (k: string) => {
                          if (keyTranslations[k]) return keyTranslations[k];
                          return k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        };

                        const formattedValue = typeof value === 'boolean'
                          ? (value ? 'Sim' : 'Não')
                          : (valueTranslations[String(value)] || String(value));

                        return (
                          <div key={key} className="break-all border-b border-slate-200/60 pb-2">
                            <span className="block text-xs font-semibold text-slate-500 mb-1">{formatKey(key)}</span>
                            <span className="block text-sm text-slate-900 font-medium">{formattedValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Fechar
                </button>
                {selectedRequest.status === 'PENDING' ? (
                  <button
                    onClick={(e) => triggerFileInput(selectedRequest.id, e)}
                    className="px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Anexar Proposta Gerada
                  </button>
                ) : selectedRequest.status === 'GENERATED' && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDeleteRequest(selectedRequest.id, e)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors flex items-center gap-2 border border-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                    <button
                      onClick={(e) => triggerFileInput(selectedRequest.id, e)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors flex items-center gap-2 border border-blue-100"
                    >
                      <Upload className="h-4 w-4" />
                      Substituir
                    </button>
                    <button
                      onClick={(e) => handleViewDocument(selectedRequest.id, e)}
                      className="px-5 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-secondary transition-colors flex items-center gap-2"
                    >
                      <FileSignature className="h-4 w-4" />
                      Ver Arquivo Anexado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
        , document.body)}

      {/* Hidden file input for uploading generated proposals */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
      />

      {/* Modal Profile / File Prezi */}
      {previewUrl && (
        <DocumentPreviewModal
          isOpen={!!previewUrl}
          onClose={() => setPreviewUrl(null)}
          documentUrl={previewUrl}
          documentTitle={`Arquivo da Proposta`}
        />
      )}

      {/* Rendeizer de Toasts Local do Painel */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              type={t.type}
              message={t.message}
              onClose={() => toast.removeToast(t.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
