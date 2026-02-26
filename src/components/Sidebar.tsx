import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Factory,
  Users,
  UserCheck,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  DollarSign,
  Cog,
  ChevronRight,
  Zap
} from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { useResponsive } from '../hooks/useResponsive';

interface SidebarProps {
  currentView: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao';
  onViewChange: (view: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao') => void;
}

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { user, logout, loading } = useAuth();
  const { isMobile } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Silently handle logout errors
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const menuItems: Array<{ id: string; label: string; icon: any; view: any; description: string }> = [];
  menuItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as const, description: 'Visão geral' });
  menuItems.push({ id: 'contratos', label: 'Contratos', icon: FileText, view: 'contratos' as const, description: 'Documentos' });
  menuItems.push({ id: 'geradores', label: 'Geradores', icon: Factory, view: 'geradores' as const, description: 'Clientes geradores' });
  menuItems.push({ id: 'consumidores', label: 'Consumidores', icon: Users, view: 'consumidores' as const, description: 'Clientes consumidores' });
  const roleForMenu = ((user?.role as unknown as string) || '').toUpperCase();
  const isOperatorPlus = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(roleForMenu);
  if (isOperatorPlus) {
    menuItems.push({ id: 'pendentes', label: 'Pendentes', icon: UserCheck, view: 'pendentes' as const, description: 'Aprovações' });
    menuItems.push({ id: 'mudancas', label: 'Mudanças', icon: Bell, view: 'mudancas' as const, description: 'Alterações' });
  }
  menuItems.push({ id: 'representantes', label: 'Representantes', icon: UserCheck, view: 'representantes' as const, description: 'Equipe comercial' });
  menuItems.push({ id: 'simulacao', label: 'Propostas', icon: Zap, view: 'simulacao' as const, description: 'Geração de propostas' });

  // Menu items específicos para SUPER_ADMIN
  const superAdminMenuItems = [
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: Users,
      view: 'usuarios' as const,
      description: 'Gestão de usuários'
    },
    {
      id: 'logs',
      label: 'Auditoria',
      icon: Bell,
      view: 'logs' as const,
      description: 'Logs do sistema'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Cog,
      view: 'configuracoes' as const,
      description: 'Ajustes do sistema'
    },
    {
      id: 'comissoes',
      label: 'Comissões',
      icon: DollarSign,
      view: 'comissoes' as const,
      description: 'Gestão de comissões'
    }
  ];

  // Determinar quais menus mostrar baseado no role do usuário (normalizando para uppercase)
  const userRoleRaw = user?.role as unknown as string | undefined;
  const userRole = (userRoleRaw || '').toUpperCase();
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const allMenuItems = isSuperAdmin ? [...menuItems, ...superAdminMenuItems] : menuItems;

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 p-2.5 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200 z-[2100]"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* Overlay para mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in z-[1500] lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - Premium Blue Design */}
      <div
        className={`
          ${isMobile ? 'fixed left-0 top-0 h-full' : 'fixed left-0 top-0 h-full'}
          bg-gradient-to-b from-accent to-accent-secondary w-64 lg:w-72 flex flex-col shadow-2xl overflow-y-auto
          transition-transform duration-300 ease-in-out will-change-transform isolate z-[2000]
          scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent
        `}
        style={{
          transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Logo Section */}
        <div className="relative h-32 flex items-center justify-center overflow-hidden border-b border-white/10 shrink-0">
          <div className="flex justify-center w-full">
            <PagluzLogo className="h-32 w-auto text-white drop-shadow-md scale-[2.0]" />
          </div>
        </div>

        {/* Navegação Principal */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="space-y-1">
            {allMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.view;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.view);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${isActive
                    ? 'bg-white text-accent shadow-lg shadow-black/10 translate-x-1 font-semibold'
                    : 'text-blue-50 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }`}
                >
                  {/* Ícone */}
                  <div className={`p-1.5 rounded-lg flex-shrink-0 transition-all duration-300 ${isActive
                    ? 'bg-accent/10 text-accent'
                    : 'bg-white/10 text-blue-100 group-hover:bg-white/20 group-hover:text-white'
                    }`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Texto */}
                  <span className="flex-1 text-left tracking-wide">{item.label}</span>

                  {/* Indicador ativo */}
                  {isActive && (
                    <ChevronRight className="h-4 w-4 text-accent animate-in slide-in-from-left-2 fade-in" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Seção de Usuário - Premium */}
        <div className="p-4 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent space-y-3">
          {/* Card de Perfil */}
          <div className="p-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm transition-colors hover:bg-white/15">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center flex-shrink-0 text-accent font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-blue-100/80 font-medium">
                  {userRole === 'SUPER_ADMIN' ? 'Super Admin' :
                    userRole === 'ADMIN' ? 'Administrador' :
                      userRole === 'MANAGER' ? 'Gerente' :
                        userRole === 'OPERATOR' ? 'Operador' :
                          userRole === 'REPRESENTATIVE' ? 'Representante' : 'Usuário'}
                </p>
              </div>
            </div>
          </div>

          {/* Botão Logout */}
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl font-medium text-sm text-blue-100 hover:text-white hover:bg-red-500/20 transition-all duration-300 border border-white/5 hover:border-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="group-hover:translate-x-1 transition-transform">{loading ? 'Saindo...' : 'Sair do Sistema'}</span>
            <div className="p-1.5 rounded-lg bg-white/10 text-white/80 group-hover:bg-red-500/20 group-hover:text-red-200 transition-colors">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
