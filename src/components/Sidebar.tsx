
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
  Cog
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



  // Removido shouldShowMobile - não está sendo usado
  


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
  menuItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as const, description: 'Visão geral do sistema' });
  menuItems.push({ id: 'contratos', label: 'Contratos', icon: FileText, view: 'contratos' as const, description: 'Geração de contratos e documentos' });
  menuItems.push({ id: 'geradores', label: 'Clientes Geradores', icon: Factory, view: 'geradores' as const, description: 'Gestão de geradores' });
  menuItems.push({ id: 'consumidores', label: 'Clientes Consumidores', icon: Users, view: 'consumidores' as const, description: 'Gestão de consumidores' });
  const roleForMenu = ((user?.role as unknown as string) || '').toUpperCase();
  const isOperatorPlus = ['SUPER_ADMIN','ADMIN','MANAGER','OPERATOR'].includes(roleForMenu);
  if (isOperatorPlus) {
    menuItems.push({ id: 'pendentes', label: 'Pendentes de aprovação', icon: UserCheck, view: 'pendentes' as const, description: 'Revisão e aprovação de cadastros' });
    menuItems.push({ id: 'mudancas', label: 'Mudanças Pendentes', icon: Bell, view: 'mudancas' as const, description: 'Aprovar/rejeitar alterações' });
  }
  menuItems.push({ id: 'representantes', label: 'Representantes', icon: UserCheck, view: 'representantes' as const, description: 'Gestão de representantes' });

  // Menu items específicos para SUPER_ADMIN
  const superAdminMenuItems = [
    {
      id: 'usuarios',
      label: 'Usuários do Sistema',
      icon: Users,
      view: 'usuarios' as const,
      description: 'Gestão de usuários'
    },
    {
      id: 'logs',
      label: 'Logs de Atividade',
      icon: Bell,
      view: 'logs' as const,
      description: 'Auditoria do sistema'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Cog,
      view: 'configuracoes' as const,
      description: 'Configurações do sistema'
    },
    {
      id: 'comissoes',
      label: 'Gestão de Comissões',
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
          className="fixed top-3 left-3 p-3 bg-pagluz-primary text-white rounded-xl lg:hidden shadow-lg hover:bg-pagluz-primaryHover active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-200 z-[2100]"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* Overlay para mobile */}
      {isMobile && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in z-[1500] lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar - Responsiva para notebooks */}
      <div 
        className={`
          ${isMobile ? 'fixed left-0 top-0 h-full' : 'fixed left-0 top-0 h-full'}
          bg-gradient-to-b from-[#0c3a59] via-[#0b3049] to-[#081f31] w-64 lg:w-64 xl:w-72 flex flex-col shadow-2xl border-r border-slate-800/60 overflow-y-auto
          transition-transform duration-300 ease-in-out will-change-transform isolate z-[2000]
        `}
        style={{ 
          transform: isMobile && !isMobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >
      

      {/* Navegação Principal */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Navegação Principal
          </h3>
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
                className={`w-full flex items-center px-4 py-3.5 rounded-xl text-left transition-all duration-300 group relative focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  isActive
                    ? 'bg-slate-700/60 text-white shadow-lg border border-white/10'
                    : 'text-slate-300 hover:bg-slate-700/40 hover:text-white'
                }`}
              >
                {/* Indicador ativo */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full"></div>
                )}
                
                <div className={`p-2 rounded-lg mr-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-slate-600/60 text-white' 
                    : 'bg-slate-600/30 text-slate-300 group-hover:bg-slate-600/50 group-hover:text-white'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm block truncate">{item.label}</span>
                  <p className={`text-xs mt-0.5 hidden xl:block ${
                    isActive ? 'text-white/70' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {item.description}
                  </p>
                </div>
                
                {/* Efeito de hover */}
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-white shadow-lg shadow-white/30' 
                    : 'bg-transparent group-hover:bg-white/40'
                }`}></div>
              </button>
            );
          })}
        </div>

        {/* Seção de Configurações */}
        <div className="pt-3 border-t border-slate-700/40">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
            Sistema
          </h3>
          
          <button className="w-full flex items-center px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <div className="p-2 rounded-lg mr-4 bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-white transition-all duration-300">
              <Bell className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm">Notificações</span>
          </button>
          
          <button className="w-full flex items-center px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30">
            <div className="p-2 rounded-lg mr-4 bg-slate-700/50 text-slate-400 group-hover:bg-slate-600/50 group-hover:text-white transition-all duration-300">
              <Settings className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm">Configurações</span>
          </button>
        </div>
      </nav>

      {/* Perfil do Usuário */}
      <div className="p-4 border-t border-slate-700/40 bg-slate-800 mt-0">
        <div className="flex items-center mb-4 p-3 rounded-xl bg-slate-700/50 border border-white/10">
          <div className="w-10 h-10 bg-gradient-pagluz rounded-xl flex items-center justify-center shadow-pagluzGreen">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-white">
              {user?.name || user?.email}
            </p>
            <p className="text-xs text-slate-400">
              {userRole === 'SUPER_ADMIN' ? 'Super Administrador' : 
               userRole === 'ADMIN' ? 'Administrador' : 
               userRole === 'MANAGER' ? 'Gerente' : 
               userRole === 'OPERATOR' ? 'Operador' : 
               userRole === 'REPRESENTATIVE' ? 'Representante' : 'Usuário'}
            </p>
          </div>
          <div className="w-2 h-2 bg-white rounded-full shadow-lg shadow-white/30"></div>
        </div>
        
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full flex items-center px-4 py-3 text-slate-300 hover:bg-red-500/15 hover:text-red-400 rounded-xl transition-all duration-300 group border border-white/10 hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 active:scale-[0.98]"
        >
          <div className="p-2 rounded-lg mr-3 bg-slate-700/70 text-slate-300 group-hover:bg-red-500/20 group-hover:text-red-400 transition-all duration-300">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </div>
          <span className="text-sm font-medium">
            {loading ? 'Saindo...' : 'Sair do Sistema'}
          </span>
        </button>
      </div>
      
    </div>
    </>
  );
}

