import { useEffect, useState } from 'react';
import { api } from '../../types/services/api';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../hooks/useToast';
import { Consumer } from '../../types';
import {
  ThumbsDown,
  Search,
  AlertCircle,
  FileText,
  UserCheck
} from 'lucide-react';
import Input from '../ui/Input';
import Badge from '../ui/Badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RejectedConsumers() {
  const { user } = useApp();
  const toast = useToast();
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRejected = async () => {
    try {
      setLoading(true);
      const response = await api.get('/consumers');
      let allData: Consumer[] = [];
      if (Array.isArray(response)) {
        allData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        allData = response.data;
      } else if (response?.consumers && Array.isArray(response.consumers)) {
        allData = response.consumers;
      }
      
      const rejected = allData.filter((c: any) => 
        c.status === 'REJECTED' || 
        c.status === 'PROPOSAL_REJECTED' || 
        c.approvalStatus === 'REJECTED' || 
        c.proposalStatus === 'PROPOSAL_REJECTED'
      );
      
      setConsumers(rejected);
    } catch (error) {
      toast.showError('Erro ao buscar consumidores recusados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejected();
  }, []);

  const isOperatorPlus = user && ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(((user.role as unknown as string) || '').toUpperCase());
  if (!isOperatorPlus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Permissão Insuficiente</h2>
        <p className="text-slate-500 max-w-md">
          Você não possui permissão para acessar a área de recusados.
        </p>
      </div>
    );
  }

  const filteredConsumers = consumers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.cpfCnpj.includes(searchTerm) || 
    (c.Representative?.name || c.representativeName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-50 rounded-xl text-red-600">
            <ThumbsDown className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-900">Consumidores Recusados</h1>
            <p className="text-slate-500 mt-1">Consulte os históricos de recusa de cadastro e de propostas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            placeholder="Buscar por nome, CPF/CNPJ..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
            className="w-full sm:w-64"
          />
          <button
            onClick={fetchRejected}
            className="px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Consumidor</th>
                <th className="px-6 py-4 whitespace-nowrap">Contato / Localização</th>
                <th className="px-6 py-4 whitespace-nowrap">Representante</th>
                <th className="px-6 py-4 whitespace-nowrap">Fase Recusa</th>
                <th className="px-6 py-4 whitespace-nowrap">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Buscando consumidores recusados...</td></tr>
              )}
              {!loading && filteredConsumers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="mx-auto h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                      <ThumbsDown className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 font-display">Nenhum registro encontrado</h3>
                    <p className="text-slate-500 mt-1">Ainda não há consumidores ou propostas recusadas cadastradas.</p>
                  </td>
                </tr>
              )}
              {!loading && filteredConsumers.map((c: any) => {
                const isProposalRejection = c.status === 'PROPOSAL_REJECTED' || c.proposalStatus === 'PROPOSAL_REJECTED';
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 font-display text-base">{c.name}</span>
                        <span className="text-xs text-slate-500 font-mono font-medium">{c.cpfCnpj}</span>
                        <Badge variant="outline" className="mt-2 w-max bg-slate-100 text-slate-600 border-slate-200 text-[10px]">
                          {c.consumerType}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-slate-600">
                        <span>{c.city} - {c.state}</span>
                        <span className="text-xs mt-0.5">{c.email}</span>
                        <span className="text-xs mt-0.5">{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {c.Representative || c.representativeName ? (
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-medium flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                            {c.Representative?.name || c.representativeName}
                          </span>
                          <span className="text-xs text-slate-500 mt-0.5">{c.Representative?.email || 'N/A'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Administrador (Direto)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 flex-row text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                        {isProposalRejection ? (
                          <><FileText className="w-3.5 h-3.5" /> Recusa na Proposta</>
                        ) : (
                          <><ThumbsDown className="w-3.5 h-3.5" /> Recusa no Cadastro</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="text-sm text-slate-700">
                        {c.updatedAt ? format(new Date(c.updatedAt), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
