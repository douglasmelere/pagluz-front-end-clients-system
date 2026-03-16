import { useState, useEffect, useMemo } from 'react';
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
  ChevronDown,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  FolderOpen,
  Megaphone,
  MessageSquareText,
  FileSpreadsheet,
  Trophy,
  Activity,
  BarChart3,
  BellRing,
  Coins,
} from 'lucide-react';
import PagluzLogo from './common/PagluzLogo';
import { useResponsive } from '../hooks/useResponsive';
import { api } from '../types/services/api';
import AvatarUpload from './common/AvatarUpload';

type AppView = 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes' | 'simulacao' | 'solicitacoes' | 'materiais' | 'comunicados' | 'feedbacks' | 'relatorios' | 'ranking' | 'timeline' | 'push' | 'dashboard-avancado' | 'tarifas';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onWidthChange?: (width: number) => void;
}

const SIDEBAR_DEFAULT = 280;
const COLLAPSED_W = 80;

type MenuItemDef = {
  id: string;
  label: string;
  icon: any;
  view?: AppView;
  description: string;
  submenu?: MenuItemDef[];
};

export default function Sidebar({ currentView, onViewChange, onWidthChange }: SidebarProps) {
  const { user, logout, loading, updateUser } = useAuth();
  const { isMobile } = useResponsive();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Sincronizar avatarUrl quando o objeto user mudar
  useEffect(() => {
    if (user) {
      const cachedAvatar = localStorage.getItem(`pagluz_avatar_${user.id}`);
      const userPhoto = (user as any).avatarUrl || (user as any).avatar || (user as any).fileUrl;
      setAvatarUrl(cachedAvatar || userPhoto || null);
    }
  }, [user]);

  // Estados do redimensionamento (sincronizados se onWidthChange for suportado no App.tsx)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('pagluz.sidebar.collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('pagluz.sidebar.collapsed', isCollapsed.toString());
    if (onWidthChange) {
      if (isMobile) {
        onWidthChange(0);
      } else {
        onWidthChange(isCollapsed ? COLLAPSED_W : SIDEBAR_DEFAULT);
      }
    }
  }, [isCollapsed, isMobile, onWidthChange]);

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  const toggleGroup = (groupId: string) => {
    if (isCollapsed && !isMobile) {
      setIsCollapsed(false);
      setOpenGroups(prev => ({ ...prev, [groupId]: true }));
    } else {
      setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Silently handle
    }
  };

  const handleUploadAdminAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setAvatarUploading(true);
      const res: any = await api.post('/users/me/avatar', formData);
      const newUrl = res?.avatarUrl ?? res?.fileUrl ?? res?.url;

      if (newUrl) {
        setAvatarUrl(newUrl);
        if (user?.id) {
          localStorage.setItem(`pagluz_avatar_${user.id}`, newUrl);
          updateUser({ avatarUrl: newUrl });
        }
      } else {
        const localPreview = URL.createObjectURL(file);
        setAvatarUrl(localPreview);
      }
    } catch {
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAdminAvatar = async () => {
    try {
      setAvatarUploading(true);
      await api.delete('/users/me/avatar');
      setAvatarUrl(null);
      if (user?.id) {
        localStorage.removeItem(`pagluz_avatar_${user.id}`);
        updateUser({ avatarUrl: null });
      }
    } catch {
    } finally {
      setAvatarUploading(false);
    }
  };

  const userRoleRaw = user?.role as unknown as string | undefined;
  const userRole = (userRoleRaw || '').toUpperCase();
  
  const menuItems = useMemo(() => {
    const isOperatorPlus = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(userRole);
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    const items: MenuItemDef[] = [];

    items.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard', description: 'Visão geral' });

    items.push({
      id: 'comercial',
      label: 'Comercial',
      icon: Users,
      description: 'Vendas e clientes',
      submenu: [
        { id: 'simulacao', label: 'Propostas', icon: Zap, view: 'simulacao', description: 'Geração de propostas' },
        { id: 'geradores', label: 'Geradores', icon: Factory, view: 'geradores', description: 'Clientes geradores' },
        { id: 'consumidores', label: 'Consumidores', icon: Users, view: 'consumidores', description: 'Clientes consumidores' },
        { id: 'representantes', label: 'Representantes', icon: UserCheck, view: 'representantes', description: 'Equipe comercial' },
      ]
    });

    const gestaoSub: MenuItemDef[] = [
      { id: 'contratos', label: 'Contratos', icon: FileText, view: 'contratos', description: 'Documentos' },
    ];

    if (isOperatorPlus) {
      gestaoSub.push({ id: 'solicitacoes', label: 'Solicitações', icon: FileText, view: 'solicitacoes', description: 'Propostas solicitadas' });
      gestaoSub.push({ id: 'pendentes', label: 'Pendentes', icon: UserCheck, view: 'pendentes', description: 'Aprovações' });
      gestaoSub.push({ id: 'mudancas', label: 'Mudanças', icon: Bell, view: 'mudancas', description: 'Alterações' });
    }

    items.push({
      id: 'gestao',
      label: 'Gestão',
      icon: FileText,
      description: 'Processos e docs',
      submenu: gestaoSub
    });

    items.push({
      id: 'desempenho',
      label: 'Resultados',
      icon: BarChart3,
      description: 'Desempenho e relatórios',
      submenu: [
        { id: 'relatorios', label: 'Relatórios', icon: FileSpreadsheet, view: 'relatorios', description: 'Exportar dados' },
        { id: 'dashboard-avancado', label: 'Gráficos', icon: BarChart3, view: 'dashboard-avancado', description: 'Dashboard avançado' },
        { id: 'ranking', label: 'Ranking', icon: Trophy, view: 'ranking', description: 'Performance e metas' },
      ]
    });

    items.push({
      id: 'comunicacao',
      label: 'Comunicação',
      icon: MessageSquareText,
      description: 'Avisos e engajamento',
      submenu: [
        { id: 'materiais', label: 'Materiais', icon: FolderOpen, view: 'materiais', description: 'Materiais comerciais' },
        { id: 'comunicados', label: 'Comunicados', icon: Megaphone, view: 'comunicados', description: 'Avisos e comunicados' },
        { id: 'feedbacks', label: 'Feedbacks', icon: MessageSquareText, view: 'feedbacks', description: 'Feedbacks' },
      ]
    });

    const configSub: MenuItemDef[] = [
      { id: 'tarifas', label: 'Tarifas', icon: Coins, view: 'tarifas', description: 'Preços kWh' },
      { id: 'timeline', label: 'Timeline', icon: Activity, view: 'timeline', description: 'Atividades' },
      { id: 'push', label: 'Push', icon: BellRing, view: 'push', description: 'Notificações push' },
    ];

    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      configSub.push({ id: 'comissoes', label: 'Comissões', icon: DollarSign, view: 'comissoes', description: 'Gestão de comissões' });
      configSub.push({ id: 'configuracoes', label: 'Configurações', icon: Cog, view: 'configuracoes', description: 'Ajustes do sistema' });
    }

    if (isSuperAdmin) {
      configSub.push({ id: 'usuarios', label: 'Usuários', icon: Users, view: 'usuarios', description: 'Gestão de usuários' });
      configSub.push({ id: 'logs', label: 'Auditoria', icon: Bell, view: 'logs', description: 'Logs do sistema' });
    }

    items.push({
      id: 'config',
      label: 'Sistema',
      icon: Cog,
      description: 'Configurações',
      submenu: configSub
    });

    return items;
  }, [userRole]);

  // Expand group that contains the current nested active view
  useEffect(() => {
    if (isCollapsed) return;
    menuItems.forEach(item => {
      if (item.submenu?.some(sub => sub.view === currentView)) {
        setOpenGroups(prev => {
          if (!prev[item.id]) {
            return { ...prev, [item.id]: true };
          }
          return prev;
        });
      }
    });
  }, [currentView, menuItems, isCollapsed]);

  const roleLabel: Record<string, string> = {
    'SUPER_ADMIN': 'Super Admin',
    'ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'OPERATOR': 'Operador',
    'USER': 'Usuário'
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 right-4 p-2.5 bg-gradient-to-r from-accent to-accent-secondary text-white rounded-lg shadow-lg hover:shadow-xl active:scale-95 z-[2100]"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      )}

      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1500]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`fixed left-0 top-0 h-full bg-gradient-to-b from-accent to-accent-secondary text-slate-100 flex flex-col shadow-2xl overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-300 ease-in-out z-[2000]
          ${isMobile ? (isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
        style={{
          width: isMobile ? SIDEBAR_DEFAULT : (isCollapsed ? COLLAPSED_W : SIDEBAR_DEFAULT),
        }}
      >
        <div className={`relative flex flex-col items-center shrink-0 border-b border-white/10 ${isCollapsed ? 'py-4 gap-2' : 'pt-4 pb-2'}`}>
          {!isCollapsed && (
            <div className="flex justify-center items-center w-full h-16 mt-4 mb-2 overflow-visible">
              <PagluzLogo className="h-28 w-auto text-white drop-shadow-md scale-[2.2] -ml-2" />
            </div>
          )}

          {isCollapsed && (
            <div className="mt-2 text-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-lg">
                <Zap className="h-6 w-6 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          )}

          {!isMobile && (
            <button
              onClick={toggleCollapse}
              title={isCollapsed ? "Expandir menu" : "Ocultar menu"}
              className={`relative z-10 p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center cursor-pointer pointer-events-auto mt-2`}
            >
              {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {menuItems.map(item => {
            const Icon = item.icon;
            const hasSub = item.submenu && item.submenu.length > 0;
            const isGroupOpen = openGroups[item.id] || false;
            
            // Um item pai pode estar ativo se a visualização atual for ele ou algum de seus filhos
            const isActive = item.view === currentView || (hasSub && item.submenu!.some(s => s.view === currentView));

            return (
              <div key={item.id} className="relative group/item space-y-1">
                <button
                  onClick={() => {
                    if (hasSub) {
                      toggleGroup(item.id);
                    } else if (item.view) {
                      onViewChange(item.view);
                      if (isMobile) setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 font-medium text-sm
                    ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
                    ${isActive && !hasSub
                      ? 'bg-white text-accent shadow-lg shadow-black/10 translate-x-1 font-semibold'
                      : 'text-blue-50 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
                >
                  <div className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${isActive && !hasSub ? 'bg-accent/10 text-accent' : 'bg-white/10 text-blue-100 group-hover/item:bg-white/20 group-hover/item:text-white'}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {!isCollapsed && (
                    <span className="flex-1 text-left tracking-wide truncate">{item.label}</span>
                  )}

                  {!isCollapsed && hasSub && (
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isGroupOpen ? 'rotate-180' : ''}`} />
                  )}
                  {!isCollapsed && isActive && !hasSub && (
                    <ChevronRight className="h-4 w-4 animate-in fade-in slide-in-from-left-2 shrink-0" />
                  )}
                </button>

                {/* Submenu Expansion */}
                {hasSub && isGroupOpen && !isCollapsed && (
                  <div className="pl-11 pr-2 pb-1 space-y-1 animate-in slide-in-from-top-2 fade-in duration-200">
                    {item.submenu!.map(sub => {
                       const SubIcon = sub.icon;
                       const isSubActive = currentView === sub.view;
                       return (
                         <button
                           key={sub.id}
                           onClick={() => {
                             if (sub.view) onViewChange(sub.view);
                             if (isMobile) setIsMobileMenuOpen(false);
                           }}
                           className={`w-full flex items-center gap-3 rounded-lg py-2.5 px-3 transition-colors text-sm
                             ${isSubActive ? 'bg-white/20 text-white font-medium shadow-sm' : 'text-blue-100/70 hover:bg-white/10 hover:text-white'}`}
                         >
                           <SubIcon className="h-4 w-4 shrink-0" />
                           <span className="flex-1 text-left truncate">{sub.label}</span>
                         </button>
                       )
                    })}
                  </div>
                )}

                {/* Submenu hover from collapsed sidebar */}
                {isCollapsed && !isMobile && (
                  <div className="absolute left-full top-0 ml-3 bg-slate-900 border border-white/10 rounded-lg shadow-xl opacity-0 group-hover/item:opacity-100 group-hover/item:pointer-events-auto pointer-events-none z-50 whitespace-nowrap overflow-hidden transition-opacity">
                    <div className="px-3 py-2 border-b border-white/10 bg-slate-800">
                      <span className="text-white text-xs font-medium">{item.label}</span>
                      <span className="block text-white/50 text-[10px] mt-0.5">{item.description}</span>
                    </div>
                    {hasSub && (
                      <div className="flex flex-col py-1">
                        {item.submenu!.map(sub => {
                           const isSubActive = currentView === sub.view;
                           return (
                             <button 
                               key={sub.id}
                               onClick={() => {
                                 if (sub.view) onViewChange(sub.view);
                               }}
                               className={`px-4 py-2 text-xs flex items-center gap-2 text-left w-full hover:bg-white/10 transition-colors
                                 ${isSubActive ? 'text-white bg-white/5 font-semibold' : 'text-blue-200/80 hover:text-white'}`}
                             >
                                <sub.icon className="h-3 w-3" />
                                {sub.label}
                             </button>
                           );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent space-y-3">
          <div className={`rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm
            ${isCollapsed ? 'p-1' : 'p-3'}`}
          >
            <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'gap-3'}`}>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                name={user?.name}
                size={isCollapsed ? 48 : 44}
                onUpload={handleUploadAdminAvatar}
                onRemove={handleRemoveAdminAvatar}
                disabled={avatarUploading}
                hideButtons={true}
                className={isCollapsed ? 'scale-75 origin-top' : ''}
              />

              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-blue-100/80 font-medium truncate">
                    {roleLabel[userRole] || 'Usuário'}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      const card = e.currentTarget.closest('.rounded-xl');
                      const input = card?.querySelector('input[type="file"]') as HTMLInputElement;
                      input?.click();
                    }}
                    className="text-[10px] text-blue-200/60 hover:text-blue-100 transition-colors mt-0.5 leading-tight block"
                  >
                    Alterar foto
                  </button>
                </div>
              )}
            </div>
          </div>

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
