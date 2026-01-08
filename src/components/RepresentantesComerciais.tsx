import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Percent,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { Representative, RepresentativeStatus } from '../types';
import { RepresentanteComercialCreate } from '../types/services/representanteComercialService';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { api } from '../types/services/api';

export default function RepresentantesComerciais() {
  const {
    representantes,
    loading,
    error,
    statistics,
    createRepresentante,
    updateRepresentante,
    deleteRepresentante,
    updateStatus,
    applyFilters,
    clearFilters
  } = useRepresentantesComerciais();
  
  const toast = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingRepresentante, setEditingRepresentante] = useState<Representative | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    city: '',
    state: '',
    specialization: ''
  });

  const [formData, setFormData] = useState<RepresentanteComercialCreate>({
    name: '',
    email: '',
    password: '',
    cpfCnpj: '',
    phone: '',
    city: '',
    state: '',
    specializations: [],
    notes: ''
  });

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const especializacoes = [
    'SOLAR', 'HYDRO', 'WIND', 'BIOMASS', 'RESIDENTIAL', 'COMMERCIAL', 'RURAL', 'INDUSTRIAL'
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo', icon: CheckCircle, color: 'text-green-500' },
    { value: 'INACTIVE', label: 'Inativo', icon: XCircle, color: 'text-red-500' },
    { value: 'PENDING_APPROVAL', label: 'Pendente', icon: Clock, color: 'text-yellow-500' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação da senha
    if (!editingRepresentante) {
      if (!formData.password || formData.password.trim() === '') {
        showError('A senha é obrigatória para novos representantes');
        return;
      }
      if (formData.password.length < 6) {
        showError('A senha deve ter pelo menos 6 caracteres');
        return;
      }
    }
    
    try {
      if (editingRepresentante) {
        await updateRepresentante(editingRepresentante.id, formData);
      } else {
        await createRepresentante(formData);
      }
      handleCloseModal();
      resetForm();
    } catch (error) {
      // Error handled by toast
    }
  };

  const handleEdit = (representante: Representative) => {
    setEditingRepresentante(representante);
    setFormData({
      name: representante.name,
      email: representante.email,
      password: '', // Password is not editable
      cpfCnpj: representante.cpfCnpj,
      phone: representante.phone,
      city: representante.city,
      state: representante.state,
      specializations: representante.specializations,
      notes: representante.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este representante?')) {
      try {
        await deleteRepresentante(id);
      } catch (error) {
        // Error handled by toast
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: RepresentativeStatus) => {
    try {
      await updateStatus(id, newStatus);
    } catch (error) {
      // Error handled by toast
    }
  };

  const handleFilters = () => {
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    applyFilters(activeFilters);
  };

  const exportRepresentantes = async () => {
    try {
      // Tentar exportação via API primeiro
      try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, value.toString());
        });
        
        const endpoint = `/representatives/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(endpoint);
        
        // Criar e baixar arquivo CSV
        const csvContent = response.csvContent || '';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `representantes-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.showSuccess('Representantes exportados com sucesso!');
        return;
      } catch (apiError) {
        // Se a API falhar, fazer exportação local

      }
      
      // Exportação local como fallback
      const representantesParaExportar = filters && Object.keys(filters).length > 0 
        ? representantes.filter(rep => {
            // Aplicar filtros localmente
            if (filters.search && !rep.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
            if (filters.status && rep.status !== filters.status) return false;
            if (filters.state && rep.state !== filters.state) return false;
            if (filters.specialization && !rep.specializations.includes(filters.specialization)) return false;
            return true;
          })
        : representantes;
      
      // Criar CSV localmente
      const headers = ['Nome', 'Email', 'CPF/CNPJ', 'Telefone', 'Cidade', 'Estado', 'Especializações', 'Status', 'Data de Criação'];
      const csvRows = [
        headers.join(','),
        ...representantesParaExportar.map(rep => [
          `"${rep.name}"`,
          `"${rep.email}"`,
          `"${rep.cpfCnpj || ''}"`,
          `"${rep.phone || ''}"`,
          `"${rep.city || ''}"`,
          `"${rep.state || ''}"`,
          `"${(rep.specializations || []).join('; ')}"`,
          rep.status,
          rep.createdAt
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `representantes-local-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.showSuccess(`Representantes exportados localmente (${representantesParaExportar.length} registros)`);
    } catch (error) {
      toast.showError('Erro ao exportar representantes');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRepresentante(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      cpfCnpj: '',
      phone: '',
      city: '',
      state: '',
      commissionRate: 0,
      specializations: [],
      notes: ''
    });
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  if (loading && representantes.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Representantes Comerciais
              </h1>
              <p className="text-slate-600">
                Gerencie os representantes comerciais do sistema
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Novo Representante
            </button>
          </div>

          {/* Estatísticas */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total</p>
                    <p className="text-2xl font-bold text-slate-900">{statistics.total}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{statistics.byStatus?.[RepresentativeStatus.ACTIVE] || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Taxa Média</p>
                    <p className="text-2xl font-bold text-purple-600">
                      N/A
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Percent className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{statistics.byStatus?.[RepresentativeStatus.PENDING_APPROVAL] || 0}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-xl">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Filtros</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Buscar por nome, email ou CPF/CNPJ"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              
              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os estados</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleFilters}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Aplicar Filtros
            </button>
            <button
              onClick={exportRepresentantes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <button
              onClick={() => {
                setFilters({ search: '', status: '', city: '', state: '', specialization: '' });
                clearFilters();
              }}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Lista de Representantes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Representante
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contato
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Localização
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Comissão
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-10 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {representantes.map((representante) => (
                  <tr key={representante.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {representante.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{representante.name}</div>
                          <div className="text-sm text-slate-500">{representante.cpfCnpj}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-8 py-4">
                      <div className="text-sm text-slate-900">{representante.email}</div>
                      <div className="text-sm text-slate-500">{representante.phone}</div>
                    </td>
                    
                    <td className="px-8 py-4">
                      <div className="text-sm text-slate-900">{representante.city}</div>
                      <div className="text-sm text-slate-500">{representante.state}</div>
                    </td>
                    
                    <td className="px-8 py-4">
                      <div className="text-sm font-medium text-slate-900">
                        N/A
                      </div>
                    </td>
                    
                    <td className="px-8 py-4">
                      <select
                        value={representante.status}
                        onChange={(e) => handleStatusChange(representante.id, e.target.value as any)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-green-500 ${
                                          representante.status === RepresentativeStatus.ACTIVE
                  ? 'bg-green-100 text-green-800'
                  : representante.status === RepresentativeStatus.INACTIVE
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    
                    <td className="px-10 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(representante)}
                          className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(representante.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {editingRepresentante ? 'Editar Representante' : 'Novo Representante'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Senha {editingRepresentante ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <input
                    type="password"
                    required={!editingRepresentante}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingRepresentante ? "Deixe em branco para manter a senha atual" : "Digite a senha (mín. 6 caracteres)"}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CPF/CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Estado *
                  </label>
                  <select
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Selecione um estado</option>
                    {estados.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Especializações
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {especializacoes.map(spec => (
                    <label key={spec} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(spec)}
                        onChange={() => toggleSpecialization(spec)}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-slate-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingRepresentante ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
