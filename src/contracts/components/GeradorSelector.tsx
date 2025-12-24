import React, { useState, useEffect } from 'react';
import { GeradorData, fetchGeradores } from '../services/webhookService';
import { User, Plus, Search, Loader2 } from 'lucide-react';

interface GeradorSelectorProps {
  authData: any;
  onGeradorSelect: (gerador: GeradorData) => void;
  onNewGerador: () => void;
}

export const GeradorSelector: React.FC<GeradorSelectorProps> = ({ authData, onGeradorSelect, onNewGerador }) => {
  const [geradores, setGeradores] = useState<GeradorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadGeradores(); }, [authData]);

  const loadGeradores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchGeradores(authData);
      setGeradores(data);
    } catch (err) {
      setError('Erro ao carregar geradores salvos');
      console.error('Erro ao carregar geradores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGeradores = geradores.filter(gerador => gerador.nome.toLowerCase().includes(searchTerm.toLowerCase()) || gerador.cpf_cnpj.includes(searchTerm) || gerador.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatDocumento = (tipo: string, documento: string) => {
    if (!documento) return '';
    const cleanDoc = documento.replace(/\D/g, '');
    if (tipo === 'cpf') { if (cleanDoc.length === 11) return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'); }
    else if (tipo === 'cnpj') { if (cleanDoc.length === 14) return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5'); }
    return documento;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6"><div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600 mr-3" /><span className="text-slate-600 font-medium">Carregando geradores...</span></div></div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center"><User className="h-6 w-6 text-emerald-600 mr-3" /><h3 className="text-xl font-bold text-slate-900">Selecionar Gerador</h3></div>
        <button onClick={onNewGerador} className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 flex items-center font-medium"><Plus className="h-4 w-4 mr-2" />Novo Gerador</button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700">{error}</p><button onClick={loadGeradores} className="mt-2 text-red-600 hover:text-red-700 font-medium">Tentar novamente</button></div>
      )}
      {geradores.length === 0 && !error ? (
        <div className="text-center py-8"><User className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600 mb-4">Nenhum gerador encontrado</p><button onClick={onNewGerador} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 transition-all duration-200 font-medium">Criar Primeiro Gerador</button></div>
      ) : (
        <>
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Buscar por nome, CPF/CNPJ ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredGeradores.map((gerador) => (
              <div key={gerador.id} onClick={() => onGeradorSelect(gerador)} className="p-4 border border-slate-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 cursor-pointer transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{gerador.nome}</h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p><span className="font-medium">{gerador.tipo_documento === 'cpf' ? 'CPF:' : 'CNPJ:'}</span> {formatDocumento(gerador.tipo_documento, gerador.cpf_cnpj)}</p>
                      <p><span className="font-medium">Email:</span> {gerador.email}</p>
                      <p><span className="font-medium">Endereço:</span> {gerador.rua}, {gerador.numero} - {gerador.bairro}, {gerador.cidade}/{gerador.uf}</p>
                      <p><span className="font-medium">Banco:</span> {gerador.banco} - Ag: {gerador.agencia} - Conta: {gerador.conta}</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 ml-4">{gerador.created_at ? new Date(gerador.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}</div>
                </div>
              </div>
            ))}
          </div>
          {filteredGeradores.length === 0 && searchTerm && (<div className="text-center py-8"><Search className="h-12 w-12 text-slate-400 mx-auto mb-4" /><p className="text-slate-600">Nenhum gerador encontrado para "{searchTerm}"</p></div>)}
        </>
      )}
    </div>
  );
};


