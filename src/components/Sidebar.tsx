
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
  ChevronRight
} from 'lucide-react';
 
import { useResponsive } from '../hooks/useResponsive';

interface SidebarProps {
  currentView: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes';
  onViewChange: (view: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes') => void;
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
  const isOperatorPlus = ['SUPER_ADMIN','ADMIN','MANAGER','OPERATOR'].includes(roleForMenu);
  if (isOperatorPlus) {
    menuItems.push({ id: 'pendentes', label: 'Pendentes', icon: UserCheck, view: 'pendentes' as const, description: 'Aprovações' });
    menuItems.push({ id: 'mudancas', label: 'Mudanças', icon: Bell, view: 'mudancas' as const, description: 'Alterações' });
  }
  menuItems.push({ id: 'representantes', label: 'Representantes', icon: UserCheck, view: 'representantes' as const, description: 'Equipe comercial' });

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
          className="fixed top-4 left-4 p-2.5 bg-gradient-pagluz text-white rounded-lg shadow-lg hover:shadow-xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 transition-all duration-200 z-[2100]"
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

      {/* Sidebar - Premium Design */}
      <div 
        className={`
          ${isMobile ? 'fixed left-0 top-0 h-full' : 'fixed left-0 top-0 h-full'}
          bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 w-64 lg:w-72 flex flex-col border-r border-slate-700/50 shadow-2xl overflow-y-auto
          transition-transform duration-300 ease-in-out will-change-transform isolate z-[2000]
          scrollbar-thin scrollbar-thumb-slate-700/50 scrollbar-track-slate-900/50
        `}
        style={{ 
          transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
        {/* Navegação Principal */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">
              Menu Principal
            </h3>
            
            <div className="space-y-1.5">
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative font-medium text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 ${
                      isActive
                        ? 'bg-gradient-pagluz text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    {/* Ícone */}
                    <div className={`p-2 rounded-lg flex-shrink-0 transition-all duration-300 ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'bg-slate-700/50 text-slate-400 group-hover:bg-slate-600 group-hover:text-white'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    
                    {/* Texto */}
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {/* Indicador ativo */}
                    {isActive && (
                      <ChevronRight className="h-4 w-4 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Seção de Usuário - Premium */}
        <div className="p-4 border-t border-slate-700/50 bg-gradient-to-t from-slate-900 to-transparent space-y-3">
          {/* Card de Perfil */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600/10 to-teal-600/10 border border-emerald-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-pagluz shadow-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                </p>
                <p className="text-xs text-emerald-300/70">
                  {userRole === 'SUPER_ADMIN' ? 'Super Administrador' : 
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
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-slate-300 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-slate-700/50 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-95"
          >
            <div className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </div>
            <span>{loading ? 'Saindo...' : 'Sair'}</span>
          </button>
        </div>
      </div>
    </>
  );
}
