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
  Download,
  AlertCircle
} from 'lucide-react';
import { useRepresentantesComerciais } from '../hooks/useRepresentantesComerciais';
import { Representative, RepresentativeStatus } from '../types';
import { RepresentanteComercialCreate } from '../types/services/representanteComercialService';
import LoadingSpinner from './common/LoadingSpinner';
import ErrorMessage from './common/ErrorMessage';
import { useToast } from '../hooks/useToast';
import { api } from '../types/services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Badge from './ui/Badge';
import Modal, { ModalFooter } from './ui/Modal';

export default function RepresentantesComerciais() {
  const {
    representantes: representativesData,
    loading,
    error,
    statistics,
    createRepresentante,
    updateRepresentante,
    deleteRepresentante,
    updateStatus,
    fetchRepresentantes,
    clearFilters: hookClearFilters
  } = useRepresentantesComerciais();

  const { showError, showSuccess } = useToast();

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

  const especializacoesTranslate: Record<string, string> = {
    SOLAR: 'Solar',
    HYDRO: 'Hídrica',
    WIND: 'Eólica',
    BIOMASS: 'Biomassa',
    RESIDENTIAL: 'Residencial',
    COMMERCIAL: 'Comercial',
    RURAL: 'Rural',
    INDUSTRIAL: 'Industrial'
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'Ativo', icon: CheckCircle, color: 'success' },
    { value: 'INACTIVE', label: 'Inativo', icon: XCircle, color: 'error' },
    { value: 'PENDING_APPROVAL', label: 'Pendente', icon: Clock, color: 'warning' }
  ];

  // Client-side filtering logic
  const filteredRepresentantes = representativesData.filter(rep => {
    const searchLower = filters.search.toLowerCase();
    const searchMatch = !filters.search ||
      rep.name.toLowerCase().includes(searchLower) ||
      rep.email.toLowerCase().includes(searchLower) ||
      (rep.cpfCnpj && rep.cpfCnpj.includes(searchLower));

    const statusMatch = !filters.status || rep.status === filters.status;
    const stateMatch = !filters.state || rep.state === filters.state;
    const specMatch = !filters.specialization || (rep.specializations && rep.specializations.includes(filters.specialization));

    return searchMatch && statusMatch && stateMatch && specMatch;
  });

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
    // Just re-fetch base data to ensure freshness 
    fetchRepresentantes();
  };

  const exportRepresentantes = async () => {
    try {
      try {
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          // For export via API, we still attempt to send params
          if (value) queryParams.append(key, value.toString());
        });

        const endpoint = `/representatives/export${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await api.get(endpoint);

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

        showSuccess('Representantes exportados com sucesso!');
        return;
      } catch (apiError) {
        // Fallback handled below
      }

      // Use the already filtered list for local export
      const representantesParaExportar = filteredRepresentantes;

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

      showSuccess(`Representantes exportados localmente (${representantesParaExportar.length} registros)`);
    } catch (error) {
      showError('Erro ao exportar representantes');
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

  if (loading && representativesData.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Representantes Comerciais
                </h1>
                <p className="text-slate-500 font-medium text-sm font-display">
                  Gerencie os representantes comerciais do sistema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={exportRepresentantes}
                className="bg-white text-slate-700 hover:text-slate-900"
              >
                <Download className="h-4 w-4" /><span className="hidden sm:inline ml-2">Exportar</span>
              </Button>
              <Button
                onClick={() => setShowModal(true)}
                showArrow
              >
                <Plus className="h-4 w-4" /><span className="hidden sm:inline ml-2">Novo Representante</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Estatísticas */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display">Total</p>
                <p className="text-3xl font-bold text-slate-900 font-display mt-1">{statistics.total}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display">Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 font-display mt-1">{statistics.byStatus?.[RepresentativeStatus.ACTIVE] || 0}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>

            {typeof statistics.averageCommissionRate === 'number' && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 font-display">Taxa Média</p>
                  <p className="text-3xl font-bold text-purple-600 font-display mt-1">
                    {statistics.averageCommissionRate.toFixed(2)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <Percent className="h-6 w-6" />
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 font-display">Pendentes</p>
                <p className="text-3xl font-bold text-amber-500 font-display mt-1">{statistics.byStatus?.[RepresentativeStatus.PENDING_APPROVAL] || 0}</p>
              </div>
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="md:col-span-1">
              <Input
                label="Buscar"
                placeholder="Nome, email ou CPF/CNPJ..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="">Todos os status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>

            <Select
              label="Estado"
              value={filters.state}
              onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
            >
              <option value="">Todos os estados</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </Select>

            <div className="flex items-end gap-2">
              <Button
                onClick={handleFilters}
                className="w-full"
                variant="secondary"
              >
                Filtrar
              </Button>
              <Button
                onClick={() => {
                  setFilters({ search: '', status: '', city: '', state: '', specialization: '' });
                  hookClearFilters();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de Representantes */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Representante</th>
                  <th className="px-6 py-4 whitespace-nowrap">Contato</th>
                  <th className="px-6 py-4 whitespace-nowrap">Localização</th>
                  <th className="px-6 py-4 whitespace-nowrap">Comissão</th>
                  <th className="px-6 py-4 whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRepresentantes.map((representante) => (
                  <tr key={representante.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm ring-2 ring-white">
                          {representante.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 font-display">{representante.name}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{representante.cpfCnpj}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm">
                        <span className="text-slate-900">{representante.email}</span>
                        <span className="text-slate-500 text-xs mt-0.5">{representante.phone}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {representante.city} - {representante.state}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={representante.status}
                        onChange={(e) => handleStatusChange(representante.id, e.target.value as any)}
                        className="text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-offset-1 focus:ring-accent bg-transparent cursor-pointer"
                        style={{
                          color: representante.status === 'ACTIVE' ? '#059669' :
                            representante.status === 'INACTIVE' ? '#DC2626' : '#D97706',
                          backgroundColor: representante.status === 'ACTIVE' ? '#ECFDF5' :
                            representante.status === 'INACTIVE' ? '#FEF2F2' : '#FFFBEB',
                          padding: '4px 12px'
                        }}
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(representante)}
                          className="text-slate-600 hover:text-accent hover:bg-slate-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(representante.id)}
                          className="text-slate-600 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingRepresentante ? 'Editar Representante' : 'Novo Representante'}
        description={editingRepresentante ? 'Atualize as informações do representante.' : 'Preencha os dados para cadastrar um novo representante.'}
        size="lg"
        headerVariant="brand"
      >
        <form id="representative-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nome Completo"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />

            <Input
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />

            <Input
              label={`Senha ${editingRepresentante ? '(Opcional)' : '*'}`}
              type="password"
              required={!editingRepresentante}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder={editingRepresentante ? "Deixe em branco para manter..." : "Mín. 6 caracteres"}
            />

            <Input
              label="CPF/CNPJ"
              required
              value={formData.cpfCnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
            />

            <Input
              label="Telefone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />

            <Input
              label="Cidade"
              required
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            />

            <Select
              label="Estado"
              required
              value={formData.state}
              onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            >
              <option value="">Selecione...</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3 font-display">
              Especializações
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {especializacoes.map(spec => (
                <label key={spec} className="relative flex items-center justify-center p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:bg-slate-50 group">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={formData.specializations.includes(spec)}
                    onChange={() => toggleSpecialization(spec)}
                  />
                  <div className="absolute inset-0 border-2 border-transparent rounded-xl peer-checked:border-accent peer-checked:bg-accent/5 transition-all"></div>
                  <span className="relative z-10 text-sm font-medium text-slate-600 peer-checked:text-accent transition-colors">
                    {especializacoesTranslate[spec] || spec}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 font-display">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent text-slate-900 placeholder:text-slate-400 transition-all outline-none resize-none"
              placeholder="Observações adicionais..."
            />
          </div>
        </form>
        <ModalFooter>
          <Button variant="secondary" onClick={handleCloseModal} className="rounded-full">
            Cancelar
          </Button>
          <Button type="submit" form="representative-form" showArrow className="rounded-full">
            {editingRepresentante ? 'Salvar Alterações' : 'Cadastrar Representante'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
