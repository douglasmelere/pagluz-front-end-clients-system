import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  Factory,
  Users,
  UserCheck,
  FileText,
  LogOut,
  Bell,
  DollarSign,
  Cog,
  ChevronRight,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X
} from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { useResponsive } from '../hooks/useResponsive';

interface SidebarProps {
  currentView: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao';
  onViewChange: (view: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao') => void;
  onWidthChange?: (width: number) => void;
}

const SIDEBAR_DEFAULT = 280;
const COLLAPSED_W = 80;

export default function Sidebar({ currentView, onViewChange, onWidthChange }: SidebarProps) {
  const { user, logout, loading } = useAuth();
  const { isMobile } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados do redimensionamento (sincronizados se onWidthChange for suportado no App.tsx)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('pagluz.sidebar.collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('pagluz.sidebar.collapsed', isCollapsed.toString());
    if (onWidthChange) {
      onWidthChange(isCollapsed ? COLLAPSED_W : SIDEBAR_DEFAULT);
    }
  }, [isCollapsed, onWidthChange]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Silently handle
    }
  };

  const menuItems: Array<{ id: string; label: string; icon: any; view: any; description: string }> = [];
  menuItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' as const, description: 'Visão geral' });
  menuItems.push({ id: 'contratos', label: 'Contratos', icon: FileText, view: 'contratos' as const, description: 'Documentos' });
  menuItems.push({ id: 'geradores', label: 'Geradores', icon: Factory, view: 'geradores' as const, description: 'Clientes geradores' });
  menuItems.push({ id: 'consumidores', label: 'Consumidores', icon: Users, view: 'consumidores' as const, description: 'Clientes consumidores' });

  const userRoleRaw = user?.role as unknown as string | undefined;
  const userRole = (userRoleRaw || '').toUpperCase();
  const isOperatorPlus = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(userRole);

  if (isOperatorPlus) {
    menuItems.push({ id: 'pendentes', label: 'Pendentes', icon: UserCheck, view: 'pendentes' as const, description: 'Aprovações' });
    menuItems.push({ id: 'mudancas', label: 'Mudanças', icon: Bell, view: 'mudancas' as const, description: 'Alterações' });
  }
  menuItems.push({ id: 'representantes', label: 'Representantes', icon: UserCheck, view: 'representantes' as const, description: 'Equipe comercial' });
  menuItems.push({ id: 'simulacao', label: 'Propostas', icon: Zap, view: 'simulacao' as const, description: 'Geração de propostas' });

  const superAdminMenuItems = [
    { id: 'usuarios', label: 'Usuários', icon: Users, view: 'usuarios' as const, description: 'Gestão de usuários' },
    { id: 'logs', label: 'Auditoria', icon: Bell, view: 'logs' as const, description: 'Logs do sistema' },
    { id: 'configuracoes', label: 'Configurações', icon: Cog, view: 'configuracoes' as const, description: 'Ajustes do sistema' },
    { id: 'comissoes', label: 'Comissões', icon: DollarSign, view: 'comissoes' as const, description: 'Gestão de comissões' }
  ];

  const roleLabel: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'OPERATOR': 'Operador',
    'USER': 'Usuário'
  };

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const allMenuItems = isSuperAdmin ? [...menuItems, ...superAdminMenuItems] : menuItems;

  return (
    <>
      {/* Botão Mobile Invisível no Desktop */}
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 left-4 p-2.5 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg shadow-lg hover:shadow-xl active:scale-95 z-[2100]"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {/* Overlay Mobile */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1500]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Premium Pagluz Sidebar ─────────────────────────────────────────── */}
      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accent to-accent-secondary text-slate-100 flex flex-col shadow-2xl overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-300 ease-in-out z-[2000]
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
        style={{
          width: isMobile ? SIDEBAR_DEFAULT : (isCollapsed ? COLLAPSED_W : SIDEBAR_DEFAULT),
        }}
      >
        {/* Header com Logo e Botão Retrátil */}
        <div className={`relative flex flex-col items-center shrink-0 border-b border-white/10 ${isCollapsed ? 'py-4 gap-2' : 'pt-6 pb-4'}`}>
          {!isCollapsed && (
            <div className="flex justify-center w-full h-32 mt-4">
              <PagluzLogo className="h-32 w-auto text-white drop-shadow-md scale-[2.0]" />
            </div>
          )}

          {isCollapsed && (
            <div className="mt-2 text-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg">
                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          )}

          {/* Botão Retrátil Centralizado Abaixo */}
          {!isMobile && (
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? "Expandir menu" : "Ocultar menu"}
              className={`relative z-10 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer pointer-events-auto ${!isCollapsed ? 'mt-6' : 'mt-2'}`}
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          )}
        </div>

        {/* Navegação Menu */}
        <nav className="flex-1 py-6 space-y-1 px-3 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {allMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.view;

            return (
              <div key={item.id} className="relative group/item">
                <button
                  onClick={() => {
                    onViewChange(item.view);
                    if (isMobile) setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 font-medium text-sm
                    ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
                    ${isActive
                      ? 'bg-white text-accent shadow-lg shadow-black/10 translate-x-1 font-semibold'
                      : 'text-blue-50 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
                >
                  {/* Ícone */}
                  <div className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'bg-white/10 text-blue-100 group-hover/item:bg-white/20 group-hover/item:text-white'}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Texto */}
                  {!isCollapsed && (
                    <span className="flex-1 text-left tracking-wide truncate">{item.label}</span>
                  )}

                  {/* Seta ativo */}
                  {!isCollapsed && isActive && (
                    <ChevronRight className="h-4 w-4 animate-in fade-in slide-in-from-left-2 shrink-0" />
                  )}
                </button>

                {/* Tooltip Hover no modo colapsado */}
                {isCollapsed && !isMobile && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 pointer-events-none z-50 whitespace-nowrap border border-white/10">
                    {item.label}
                    <span className="block text-white/50 text-[10px] mt-0.5">{item.description}</span>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Perfil e Logout */}
        <div className="shrink-0 p-4 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent space-y-3">
          {/* Card User */}
          <div className={`rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm
            ${isCollapsed ? 'p-2 flex justify-center' : 'p-3'}`}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-lg bg-white shadow-md flex items-center justify-center flex-shrink-0 text-accent font-bold">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-blue-100/80 font-medium truncate">
                    {roleLabel[userRole] || 'Usuário'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sair */}
          <button
            onClick={handleLogout}
            disabled={loading}
            title="Sair do sistema"
            className={`w-full flex items-center gap-3 rounded-xl font-medium text-sm text-blue-100/90
              hover:text-white hover:bg-red-500/20 transition-colors border border-transparent hover:border-red-400/30 group
              ${isCollapsed ? 'p-3 justify-center' : 'px-4 py-3 justify-between'}`}
          >
            {!isCollapsed && (
              <span className="group-hover:translate-x-1 transition-transform">
                {loading ? 'Saindo...' : 'Sair do Sistema'}
              </span>
            )}
            <div className="p-1.5 rounded-lg bg-white/10 text-white/80 group-hover:bg-red-500/20 group-hover:text-red-200 transition-colors flex-shrink-0">
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
