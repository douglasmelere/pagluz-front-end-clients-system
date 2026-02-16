import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Trash2, Shield, UserCheck, UserX, Users } from 'lucide-react';
import { UserRole, CreateUserRequest, User as UserType } from '../types';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { api } from '../types/services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Modal, { ModalFooter } from './ui/Modal';
import LoadingSpinner from './common/LoadingSpinner';

export default function UsuariosSistema() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN'
  });

  const { showError, showSuccess } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Verificar se o usuário é SUPER_ADMIN
  useEffect(() => {
    // Aguardar o carregamento da autenticação
    if (authLoading) {
      return;
    }

    // Verificar se o usuário existe e tem a role correta
    if (!user) {
      showError('Usuário não autenticado. Faça login novamente.');
      return;
    }

    if (user.role !== 'SUPER_ADMIN') {
      showError('Acesso negado. Apenas Super Administradores podem acessar esta área.');
      return;
    }

    fetchUsers();
  }, [user, authLoading, showError]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response);
    } catch (error) {
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}`, formData);
        showSuccess('Usuário atualizado com sucesso!');
      } else {
        await api.post('/users', formData);
        showSuccess('Usuário criado com sucesso!');
      }

      setShowModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      showError('Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as any
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await api.delete(`/users/${userId}`);
      showSuccess('Usuário excluído com sucesso!');
      fetchUsers();
    } catch (error) {
      showError('Erro ao excluir usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'ADMIN'
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return <Shield className="h-4 w-4 text-red-500" />;
      case UserRole.ADMIN:
        return <Shield className="h-4 w-4 text-orange-500" />;
      case UserRole.MANAGER:
        return <UserCheck className="h-4 w-4 text-blue-500" />;
      case UserRole.OPERATOR:
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.MANAGER:
        return 'Gerente';
      case UserRole.OPERATOR:
        return 'Operador';
      default:
        return 'Usuário';
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-red-50 text-red-700 border-red-200';
      case UserRole.ADMIN:
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case UserRole.MANAGER:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case UserRole.OPERATOR:
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Mostrar loading enquanto a autenticação está sendo verificada
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Verificar se o usuário existe e tem a role correta
  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-md">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Acesso Negado</h2>
          <p className="text-slate-600 font-display">Apenas Super Administradores podem acessar esta área.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-slate-900">
                  Usuários do Sistema
                </h1>
                <p className="text-slate-500 font-medium text-sm font-display">
                  Gerencie os usuários com acesso ao sistema
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                  setShowModal(true);
                }}
                showArrow
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Tabela de Usuários */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium font-display border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap">Usuário</th>
                    <th className="px-6 py-4 whitespace-nowrap">Função</th>
                    <th className="px-6 py-4 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 whitespace-nowrap">Criado em</th>
                    <th className="px-6 py-4 whitespace-nowrap text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((userItem) => (
                    <tr key={userItem.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm ring-2 ring-white">
                            {userItem.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 font-display">{userItem.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{userItem.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(userItem.role)}`}>
                          {getRoleIcon(userItem.role)}
                          {getRoleLabel(userItem.role)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${userItem.isActive === true || userItem.isActive === undefined
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                          {(userItem.isActive === true || userItem.isActive === undefined) ? (
                            <>
                              <UserCheck className="h-3 w-3" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3" />
                              Inativo
                            </>
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {new Date(userItem.createdAt).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(userItem)}
                            className="text-slate-600 hover:text-accent hover:bg-slate-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(userItem.id)}
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
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        description={editingUser ? 'Atualize as informações do usuário.' : 'Preencha os dados para criar um novo usuário.'}
        size="md"
        headerVariant="brand"
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome completo do usuário"
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />

          <Input
            label={`Senha ${editingUser ? '(deixe em branco para manter)' : '*'}`}
            type="password"
            required={!editingUser}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={editingUser ? "Deixe em branco para manter..." : "Mín. 6 caracteres"}
          />

          <Select
            label="Função"
            required
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
          >
            <option value="ADMIN">Administrador</option>
            <option value="MANAGER">Gerente</option>
            <option value="OPERATOR">Operador</option>
          </Select>
        </form>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              setEditingUser(null);
              resetForm();
            }}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="user-form"
            showArrow
            className="rounded-full"
          >
            {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
