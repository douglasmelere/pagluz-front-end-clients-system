import React, { useState } from 'react';
import { useToast } from '../hooks/useToast';
import { useClientesGeradores } from '../hooks/useClientesGeradores';
import { useClientesConsumidores } from '../hooks/useClientesConsumidores';
import { Generator } from '../types';
import { Plus, Search, Factory, X, Loader, Filter } from 'lucide-react';
import GeneratorList from './GeneratorList';

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
    porcentagemAlocada: calcularAlocacao(g.id),
    consumersCount: consumidores.filter(c => c.generatorId === g.id).length
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



  if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="h-8 w-8 animate-spin text-green-600" /><p className="ml-3 text-slate-600">Carregando geradores...</p></div>;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm mb-8">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-accent-secondary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                <Factory className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900">Clientes Geradores</h1>
                <p className="text-slate-500 font-medium text-sm">Gestão de usinas e fontes de energia</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-3 rounded-xl flex items-center gap-x-2 font-semibold hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200 shadow-md text-sm sm:text-base">
              <Plus className="h-5 w-5" />Novo Gerador
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {[{ title: 'Total', value: stats.total, color: 'text-slate-900' }, { title: 'Em Análise', value: stats.emAnalise, color: 'text-yellow-600' }, { title: 'Aguardando Alocação', value: stats.aguardandoAlocacao, color: 'text-accent' }, { title: '100% Alocados', value: stats.totalmenteAlocados, color: 'text-emerald-600' }, { title: 'Potência Total', value: `${stats.potenciaTotal.toLocaleString()} kW`, color: 'text-purple-600' }].map(s => (
            <div key={s.title} className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
              <p className="text-sm font-medium text-slate-500 font-display mb-2">{s.title}</p>
              <p className={`text-3xl font-bold ${s.color} font-display tracking-tight`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" placeholder="Buscar por nome, CPF/CNPJ ou cidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white transition-all duration-200" />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-slate-400" />
              <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white transition-all duration-200"><option value="todos">Todos os Status</option><option value="UNDER_ANALYSIS">Em Análise</option><option value="AWAITING_ALLOCATION">Aguardando Alocação</option><option value="FULLY_ALLOCATED">Totalmente Alocada</option></select>
            </div>
            <select value={filters.sourceType} onChange={e => setFilters({ ...filters, sourceType: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50/50 focus:bg-white transition-all duration-200"><option value="todos">Todas as Fontes</option><option value="SOLAR">Solar</option><option value="WIND">Eólica</option><option value="HYDRO">Hídrica</option><option value="BIOMASS">Biomassa</option></select>
          </div>
        </div>

        <GeneratorList
          generators={filteredClientes}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
        <header className="p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex justify-between items-center"><h2 className="text-xl font-bold font-display text-slate-900">{cliente ? 'Editar Gerador' : 'Novo Gerador'}</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button></div>
        </header>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nome/Empresa *</label><input type="text" required value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">CPF/CNPJ *</label><input type="text" required value={formData.cpfCnpj} onChange={e => setFormData({ ...formData, cpfCnpj: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Fonte</label><select value={formData.sourceType} onChange={e => setFormData({ ...formData, sourceType: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium text-slate-700"><option value="SOLAR">Solar</option><option value="WIND">Eólica</option><option value="HYDRO">Hídrica</option><option value="BIOMASS">Biomassa</option></select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Potência (kW) *</label><input type="number" required value={formData.installedPower} onChange={e => setFormData({ ...formData, installedPower: parseFloat(e.target.value) })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Concessionária *</label><input type="text" required value={formData.concessionaire} onChange={e => setFormData({ ...formData, concessionaire: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Nº da UC Geradora *</label><input type="text" required value={formData.ucNumber} onChange={e => setFormData({ ...formData, ucNumber: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Cidade *</label><input type="text" required value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Estado (UF) *</label><input type="text" required maxLength={2} value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium text-slate-700"><option value="UNDER_ANALYSIS">Em Análise</option><option value="AWAITING_ALLOCATION">Aguardando Alocação</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Observações</label><textarea rows={3} value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-accent/10 focus:border-accent bg-slate-50 focus:bg-white transition-all duration-200 outline-none font-medium placeholder:text-slate-400" /></div>
          <footer className="flex justify-end gap-x-3 pt-6 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 transition-all duration-200 shadow-md">{cliente ? 'Atualizar' : 'Cadastrar'}</button>
          </footer>
        </form>
      </div>
    </div>
  );
}