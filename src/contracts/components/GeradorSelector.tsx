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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6"><div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-accent mr-3" /><span className="text-slate-600 font-medium">Carregando geradores...</span></div></div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center"><User className="h-6 w-6 text-accent mr-3" /><h3 className="text-xl font-display font-semibold text-slate-900">Selecionar Gerador</h3></div>
        <button onClick={onNewGerador} className="px-4 py-2 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200 flex items-center font-medium shadow-md"><Plus className="h-4 w-4 mr-2" />Novo Gerador</button>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-700">{error}</p><button onClick={loadGeradores} className="mt-2 text-red-600 hover:text-red-700 font-medium">Tentar novamente</button></div>
      )}
      {geradores.length === 0 && !error ? (
        <div className="text-center py-8"><User className="h-12 w-12 text-slate-300 mx-auto mb-4" /><p className="text-slate-500 mb-4 font-medium">Nenhum gerador encontrado</p><button onClick={onNewGerador} className="px-6 py-3 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium shadow-md">Criar Primeiro Gerador</button></div>
      ) : (
        <>
          <div className="relative mb-4"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" /><input type="text" placeholder="Buscar por nome, CPF/CNPJ ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-slate-50 focus:bg-white" /></div>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {filteredGeradores.map((gerador) => (
              <div key={gerador.id} onClick={() => onGeradorSelect(gerador)} className="p-4 border border-slate-200 rounded-lg hover:border-accent/50 hover:bg-accent/5 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1 font-display">{gerador.nome}</h4>
                    <div className="text-sm text-slate-500 space-y-1 font-medium">
                      <p><span className="font-semibold text-slate-700">{gerador.tipo_documento === 'cpf' ? 'CPF:' : 'CNPJ:'}</span> {formatDocumento(gerador.tipo_documento, gerador.cpf_cnpj)}</p>
                      <p><span className="font-semibold text-slate-700">Email:</span> {gerador.email}</p>
                      <p><span className="font-semibold text-slate-700">Endereço:</span> {gerador.rua}, {gerador.numero} - {gerador.bairro}, {gerador.cidade}/{gerador.uf}</p>
                      <p><span className="font-semibold text-slate-700">Banco:</span> {gerador.banco} - Ag: {gerador.agencia} - Conta: {gerador.conta}</p>
                    </div>
                  </div>
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


