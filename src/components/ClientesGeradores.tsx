import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { useClientesGeradores } from '../hooks/useClientesGeradores';
import { useClientesConsumidores } from '../hooks/useClientesConsumidores';
import { Generator } from '../types';
import { Plus, Search, Factory, Edit, Trash2, CheckCircle, Wind, Droplet, Leaf, Users, BarChart3, Activity, X, Loader } from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';

export default function ClientesGeradores() {
  const toast = useToast();
  const { clientes: geradores, loading, createCliente, updateCliente, deleteCliente } = useClientesGeradores();
  const { clientes: consumidores } = useClientesConsumidores();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Generator | null>(null);
  const [filters, setFilters] = useState({ status: 'todos', sourceType: 'todos' });

  const calcularAlocacao = (geradorId: string) => {
    const total = consumidores
      .filter(c => c.status === 'ALLOCATED' && c.generatorId === geradorId)
      .reduce((total, c) => total + (c.allocatedPercentage || 0), 0);
    return isNaN(total) ? 0 : total;
  };

  const getStatusReal = (cliente: Generator, alocacao: number) => 
    (alocacao >= 100) ? 'FULLY_ALLOCATED' : cliente.status;

  const filteredClientes = (geradores || []).map(g => ({
    ...g,
    porcentagemAlocada: calcularAlocacao(g.id)
  })).map(g => ({
    ...g,
    statusReal: getStatusReal(g, g.porcentagemAlocada)
  })).filter(c => {
    const searchMatch = c.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.cpfCnpj.includes(searchTerm) ||
                        c.city.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filters.status === 'todos' || c.statusReal === filters.status;
    const sourceMatch = filters.sourceType === 'todos' || c.sourceType === filters.sourceType;
    return searchMatch && statusMatch && sourceMatch;
  });

  const stats = {
    total: geradores?.length || 0,
    emAnalise: geradores?.filter(c => c.status === 'UNDER_ANALYSIS').length || 0,
    potenciaTotal: geradores?.reduce((acc, c) => acc + (c.installedPower || 0), 0) || 0,
    aguardandoAlocacao: filteredClientes.filter(c => c.statusReal === 'AWAITING_ALLOCATION').length,
    totalmenteAlocados: filteredClientes.filter(c => c.statusReal === 'FULLY_ALLOCATED').length
  };

  const handleEdit = (cliente: Generator) => { setEditingClient(cliente); setShowModal(true); };
  const handleAddNew = () => { setEditingClient(null); setShowModal(true); };
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      try {
        await deleteCliente(id);
        toast.showSuccess('Gerador excluído com sucesso!');
      } catch (error) { toast.showError('Erro ao excluir gerador.'); }
    }
  };

  const getStatusBadge = (status: string, alocacao: number) => {
    const config = {
      'UNDER_ANALYSIS': { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-700', icon: <Activity className="h-3 w-3" /> },
      'AWAITING_ALLOCATION': { label: `Alocando (${isNaN(alocacao) ? '0.0' : alocacao.toFixed(1)}%)`, color: 'bg-blue-100 text-blue-700', icon: <BarChart3 className="h-3 w-3" /> },
      'FULLY_ALLOCATED': { label: '100% Alocada', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> }
    }[status];
    return <span className={`inline-flex items-center gap-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100'}`}>{config?.icon}{config?.label || status}</span>;
  };

  const renderSourceTypeIcon = (sourceType: string, className: string) => ({
    'SOLAR': <PagluzLogo className={className} />, 'WIND': <Wind className={className} />, 'HYDRO': <Droplet className={className} />, 'BIOMASS': <Leaf className={className} />
  }[sourceType] || <Factory className={className} />);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="h-8 w-8 animate-spin text-green-600" /><p className="ml-3 text-slate-600">Carregando geradores...</p></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <header className="bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-600 shadow-lg rounded-b-3xl overflow-hidden">
        <div className="w-full px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-white flex items-center gap-x-4">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center"><Factory className="h-7 w-7" /></div>
              <div>
                <h1 className="text-3xl font-bold">Clientes Geradores</h1>
                <p className="text-slate-200">Gestão de usinas e fontes de energia</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl flex items-center gap-x-2 font-semibold hover:scale-105 transition-transform shadow-lg"><Plus className="h-5 w-5" />Novo Gerador</button>
          </div>
        </div>
      </header>
      
      <main className="max-w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[{ title: 'Total', value: stats.total, color: 'text-slate-800' }, { title: 'Em Análise', value: stats.emAnalise, color: 'text-yellow-600' }, { title: 'Aguardando Alocação', value: stats.aguardandoAlocacao, color: 'text-blue-600' }, { title: '100% Alocados', value: stats.totalmenteAlocados, color: 'text-green-600' }, { title: 'Potência Total', value: `${stats.potenciaTotal.toLocaleString()} kW`, color: 'text-purple-600' }].map(s => (
            <div key={s.title} className="bg-white p-5 rounded-xl shadow-md border border-slate-100">
              <p className="text-sm font-medium text-slate-500">{s.title}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Buscar por nome, CPF/CNPJ ou cidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 bg-slate-50" />
            </div>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 bg-slate-50"><option value="todos">Todos os Status</option><option value="UNDER_ANALYSIS">Em Análise</option><option value="AWAITING_ALLOCATION">Aguardando Alocação</option><option value="FULLY_ALLOCATED">Totalmente Alocada</option></select>
            <select value={filters.sourceType} onChange={e => setFilters({...filters, sourceType: e.target.value})} className="border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 bg-slate-50"><option value="todos">Todas as Fontes</option><option value="SOLAR">Solar</option><option value="WIND">Eólica</option><option value="HYDRO">Hídrica</option><option value="BIOMASS">Biomassa</option></select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50"><tr className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-6 py-4">Gerador</th><th className="px-6 py-4">Tipo/Potência</th><th className="px-6 py-4">Localização</th>
                <th className="px-6 py-4">Consumidores</th><th className="px-6 py-4">Alocação</th><th className="px-6 py-4">Status</th><th className="px-8 py-4">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-x-3">
                      <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">{renderSourceTypeIcon(c.sourceType, 'h-6 w-6 text-yellow-500')}</div>
                      <div><div className="text-sm font-bold text-slate-800">{c.ownerName}</div><div className="text-xs text-slate-500 font-mono">{c.cpfCnpj}</div></div>
                    </div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="font-semibold text-slate-700 capitalize">{c.sourceType.toLowerCase()}</div><div className="text-slate-500">{c.installedPower?.toLocaleString()} kW</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="font-semibold text-slate-700">{c.city}, {c.state}</div><div className="text-slate-500">{c.concessionaire}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><div className="flex items-center gap-x-1.5"><Users className="h-4 w-4 text-slate-400" /><span className="font-semibold">{consumidores.filter(cons => cons.generatorId === c.id).length}</span></div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="w-40"><div className="flex justify-between text-xs mb-1"><span className="font-semibold text-slate-700">{isNaN(c.porcentagemAlocada) ? '0.0' : c.porcentagemAlocada.toFixed(1)}%</span><span className="text-slate-500">100%</span></div><div className="w-full bg-slate-200 rounded-full h-2"><div className={`h-2 rounded-full transition-all ${c.porcentagemAlocada >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(c.porcentagemAlocada || 0, 100)}%` }}></div></div></div></td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(c.statusReal, c.porcentagemAlocada)}</td>
                    <td className="px-8 py-4 whitespace-nowrap"><div className="flex items-center gap-x-1">
                      <button onClick={() => handleEdit(c)} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClientes.length === 0 && <div className="text-center py-16 text-slate-500">Nenhum gerador encontrado.</div>}
          </div>
        </div>
      </main>

      {showModal && (
        <GeradorModal cliente={editingClient} onClose={() => setShowModal(false)} onSave={async (data) => {
          try {
            if (editingClient) await updateCliente(data); else await createCliente(data);
            toast.showSuccess(`Gerador ${editingClient ? 'atualizado' : 'cadastrado'}!`);
            setShowModal(false);
          } catch (error) { toast.showError('Erro ao salvar.'); }
        }} />
      )}
    </div>
  );
}

function GeradorModal({ cliente, onClose, onSave }: { cliente: Generator | null; onClose: () => void; onSave: (data: any) => void; }) {
  const [formData, setFormData] = useState({
    ownerName: cliente?.ownerName || '', cpfCnpj: cliente?.cpfCnpj || '', sourceType: cliente?.sourceType || 'SOLAR',
    installedPower: cliente?.installedPower || 0, concessionaire: cliente?.concessionaire || '', ucNumber: cliente?.ucNumber || '',
    city: cliente?.city || '', state: cliente?.state || '', status: cliente?.status || 'UNDER_ANALYSIS', observations: cliente?.observations || ''
  });
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(cliente ? { id: cliente.id, ...formData } : formData); };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl flex flex-col">
        <header className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-slate-800">{cliente ? 'Editar Gerador' : 'Novo Gerador'}</h2><button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X className="h-5 w-5 text-slate-500" /></button></div>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Nome/Empresa *</label><input type="text" required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">CPF/CNPJ *</label><input type="text" required value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Tipo de Fonte</label><select value={formData.sourceType} onChange={e => setFormData({...formData, sourceType: e.target.value})} className="w-full input"><option value="SOLAR">Solar</option><option value="WIND">Eólica</option><option value="HYDRO">Hídrica</option><option value="BIOMASS">Biomassa</option></select></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Potência (kW) *</label><input type="number" required value={formData.installedPower} onChange={e => setFormData({...formData, installedPower: parseFloat(e.target.value)})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Concessionária *</label><input type="text" required value={formData.concessionaire} onChange={e => setFormData({...formData, concessionaire: e.target.value})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Nº da UC Geradora *</label><input type="text" required value={formData.ucNumber} onChange={e => setFormData({...formData, ucNumber: e.target.value})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Cidade *</label><input type="text" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full input" /></div>
            <div><label className="block text-sm font-medium text-slate-600 mb-1">Estado (UF) *</label><input type="text" required maxLength={2} value={formData.state} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} className="w-full input" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Status</label><select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full input"><option value="UNDER_ANALYSIS">Em Análise</option><option value="AWAITING_ALLOCATION">Aguardando Alocação</option></select></div>
          <div><label className="block text-sm font-medium text-slate-600 mb-1">Observações</label><textarea rows={3} value={formData.observations} onChange={e => setFormData({...formData, observations: e.target.value})} className="w-full input" /></div>
          <footer className="flex justify-end gap-x-3 pt-5 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 transition">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition">{cliente ? 'Atualizar' : 'Cadastrar'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}